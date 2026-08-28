# frozen_string_literal: true

# Builds the space sidebar document tree as plain data.
#
# The whole tree ships to the browser in one response and the front-end renders only the nodes
# it needs, so this must stay cheap and must not render any markup.
class SpaceSidebarTree
  def initialize(space:, can_update_space:)
    @space = space
    @can_update_space = can_update_space
  end

  def as_json
    {
      "spaceId" => @space.id,
      "canUpdateSpace" => @can_update_space,
      "nodes" => build(@space.hierarchy),
    }
  end

  private

  # Only what the tree renders. Notably NOT `sync`, the Y.js CRDT blob — it is
  # multiple megabytes per space and the sidebar never looks at it.
  SELECTED_COLUMNS = "documents.id, documents.title, documents.archived"

  def documents_by_id
    @documents_by_id ||= @space.documents
      .select("#{SELECTED_COLUMNS}, EXISTS (SELECT 1 FROM versions WHERE versions.document_id = documents.id) AS has_versions")
      .index_by(&:id)
  end

  def build(nodes)
    Array(nodes).flat_map do |node|
      children = node["children"] || []
      document = documents_by_id[node["id"]]

      # Orphaned hierarchy entry: promote its children, matching the splice that
      # Space#remove_single_item_from_hierarchy! used to perform in memory.
      next build(children) if document.nil?

      # Drafts are invisible to anyone who cannot update the space, and so is their subtree.
      next [] if document.draft? && !@can_update_space

      built_children = build(children)

      payload_node = {
        "id" => document.id,
        # No `.presence` here on purpose: `title_emojiless` returns "" for an emoji-only title
        # and "" is truthy in Ruby, so the old server-rendered component labelled such a node with
        # an empty string. Falling back to the full title instead would render the emoji twice —
        # once as the icon, once as the label.
        "title" => document.title_emojiless || document.title,
      }
      payload_node["emoji"] = document.title_emoji if document.title_emoji
      payload_node["archived"] = true if document.archived?
      payload_node["draft"] = true if document.draft?
      payload_node["children"] = built_children if built_children.any?
      [payload_node]
    end
  end
end

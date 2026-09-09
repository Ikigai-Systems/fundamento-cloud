# frozen_string_literal: true

# Ancestor paths ("Grandparent › Parent › ") for many documents across many spaces,
# in one pass per space plus one query for the titles.
#
# Hierarchy nodes carry only {"id", "children"} -- no titles -- so the titles have to be
# joined back from `documents`. SpaceBlueprint.serialize_hierarchy does the same join, but
# builds the whole nested tree for every document in one space; this needs a flat
# id => path map for a handful of documents that may live in different spaces, so batching
# the title lookup *across* spaces is the point.
#
# Replaces Document#parent, which walked the entire tree in Ruby and issued a find_by per
# level -- the caller then looped that per level per document, making it
# O(documents x hierarchy_size): 4.1s for 1761 documents.
class HierarchyPaths
  SEPARATOR = " › "

  def initialize(spaces:, document_ids:)
    @spaces = Array(spaces)
    @wanted = document_ids.to_set
  end

  # "" for a root document, for one whose ancestors have all been destroyed, and for one
  # that is not in any of the given spaces -- matching what the old walk produced.
  def path_for(document_id)
    titles = ancestor_ids_by_id.fetch(document_id, []).filter_map { |id| titles_by_id[id] }
    return "" if titles.empty?

    titles.join(SEPARATOR) + SEPARATOR
  end

  private

  # Lazy throughout, so an empty result set issues no queries at all.
  def ancestor_ids_by_id
    @ancestor_ids_by_id ||= @spaces.each_with_object({}) do |space, map|
      collect(space.hierarchy, [], map)
    end
  end

  def collect(nodes, ancestors, map)
    Array(nodes).each do |node|
      map[node["id"]] = ancestors if @wanted.include?(node["id"])
      collect(node["children"], ancestors + [node["id"]], map)
    end
  end

  def titles_by_id
    @titles_by_id ||= begin
      ids = ancestor_ids_by_id.values.flatten.uniq

      if ids.empty?
        {}
      else
        # Scoped to the given spaces because hierarchies are per-space: every ancestor lives
        # in a space the caller has already policy-scoped.
        Document.where(id: ids, space_id: @spaces.map(&:id))
                .pluck(:id, :title)
                # pluck bypasses Document#title, so its "Untitled" fallback is reapplied here.
                .to_h { |id, title| [id, title.presence || "Untitled"] }
      end
    end
  end
end

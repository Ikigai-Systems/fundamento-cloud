# object_icon comes straight off the already-loaded record. The title is stored
# clean, so there is nothing to derive here any more.
Mention = Struct.new(:mention_id, :object_title, :object_icon, :object_path, :created_at)

class MentionsExtractor
  extend Rails.application.routes.url_helpers

  def self.get_all_mentions(documents, user)
    docs_by_id = documents.index_by(&:id)
    return [] if docs_by_id.empty?

    refs = ObjectReference.where(
      target_type: "User",
      target_id: user.id,
      source_type: "Document",
      source_id: docs_by_id.keys
    )

    # Batch-load versions for non-current refs that need version paths
    non_current_version_ids = refs.select { |r| !r.current? && r.source_version_id.present? }
                                  .map(&:source_version_id)
    versions_by_id = if non_current_version_ids.any?
                       Version.where(id: non_current_version_ids).index_by(&:id)
                     else
                       {}
                     end

    refs.map do |ref|
      doc = docs_by_id[ref.source_id]
      next unless doc

      Mention.new(
        mention_id: ref.source_node_id,
        created_at: ref.created_at,
        object_title: doc.title,
        object_icon: doc.icon,
        object_path: mention_path_for(ref, doc, versions_by_id)
      )
    end.compact
  end

  private

  def self.mention_path_for(ref, doc, versions_by_id)
    anchor = "mention-#{ref.source_node_id}"

    if ref.current? || ref.source_comment_id.present?
      document_path(doc, anchor: anchor)
    elsif ref.source_version_id.present?
      version = versions_by_id[ref.source_version_id]
      if version
        document_version_path(doc, version, anchor: anchor)
      else
        document_path(doc, anchor: anchor)
      end
    else
      document_path(doc, anchor: anchor)
    end
  end

  def self.url_options
    Rails.application.config.action_mailer.default_url_options
  end
end

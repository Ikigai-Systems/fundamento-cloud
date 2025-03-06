Mention = Struct.new(:mention_id, :object_title, :object_path, :created_at)
class MentionsExtractor
  extend Rails.application.routes.url_helpers

  def self.get_all_mentions(documents, user)
    all_mentions_by_id = Hash.new

    documents.each do |document|
      document_versions = document.versions.order(sequential_id: :asc)
      document_versions.each do |version|
        mentions_ids = mentions_from_blocknote(version.content, user)
        mentions_ids.each do |mention_id|
          # We assume mention was created in the oldest version it was referenced ever so we skip all subsequent versions,
          # unless the mention is still present in the most recent (current) version - in that case we want to provide link
          # to the current Document view page instead of to the historical Version page
          if all_mentions_by_id.has_key?(mention_id)
            if version == document_versions.last
              all_mentions_by_id[mention_id].object_path = document_path(document, anchor: "mention-#{mention_id}")
            end
          else
            all_mentions_by_id[mention_id] = Mention.new(
              mention_id: mention_id,
              created_at: version.created_at,
              object_title: document.title,
              object_path: version  == document_versions.last ?
                  document_path(document, anchor: "mention-#{mention_id}") :
                  document_version_path(document, version, anchor: "mention-#{mention_id}")
            )
          end
        end
      end

      document_comments = document.comments.order(created_at: :desc)
      document_comments.each do |comment|
        mentions_ids = mentions_from_blocknote(comment.comment, user)
        mentions_ids.each do |mention_id|
          unless all_mentions_by_id.has_key?(mention_id)
            all_mentions_by_id[mention_id] = Mention.new(
              mention_id: mention_id,
              created_at: comment.created_at,
              object_title: document.title,
              object_path: document_path(document, anchor: "mention-#{mention_id}")
            )
          end
        end
      end
    end

    all_mentions_by_id.values
  end

  private

  def self.url_options
    Rails.application.config.action_mailer.default_url_options
  end

  def self.mentions_from_blocknote(blocknote_document, user)
    assert blocknote_document.is_a?(Array), "BlockNote document should be an Array"

    all_mentions_ids = []

    blocknote_document.each do |block|
      each_mention(block) do |mention|
        if mention.dig("props", "entity") == "user" && (user.nil? || mention.dig("props", "entityId") == user.id)
          all_mentions_ids.push(mention.dig("props", "id"))
        end
      end
    end

    all_mentions_ids
  end

  def self.each_mention(node, &block)
    return unless node.is_a? Hash

    if node.dig("type") == "mention"
      yield node
    end
    node.each do |key, value|
      if key.is_a? Hash
        each_mention(key, &block)
      end

      if value.is_a? Hash
        each_mention(value, &block)
      elsif value.is_a? Array
        value.each { |elem| each_mention(elem, &block) }
      end
    end
  end
end

DocumentReference = Struct.new(:referenced_type, :referenced_id, :referenced_by, :referenced_path, :referenced_title) do
  include EmojiExtractable
  extracts_emoji_from :referenced_title
end

class ReferencesExtractor
  def self.all_references(documents)
    # We only return single reference for every object that references it
    # so they key is [referenced_by, referenced_type, referenced_id]
    unique_references = Hash.new

    documents.each do |document|
      Sentry.set_context(
        "document", {
          id: document.id,
        }
      )

      document_versions = document.versions.order(sequential_id: :desc).first(1)
      document_versions.each do |version|
        Sentry.set_context(
          "version", {
            id: version.id,
          }
        )

        references = references_from_blocknote(version.content_blocks)
        references.each do |reference|
          key = [document, reference[:object_type], reference[:object_id]]
          unless unique_references.has_key?(key)
            unique_references[key] = DocumentReference.new(
              referenced_by: document,
              referenced_type: reference[:object_type],
              referenced_id: reference[:object_id],
            )
          end
        end
      end

      document_comments = document.comments.order(created_at: :desc)
      document_comments.each do |comment|
        Sentry.set_context(
          "comment", {
            id: comment.id,
          }
        )

        references = references_from_blocknote(comment.content)
        references.each do |reference|
          key = [document, reference[:object_type], reference[:object_id]]
          unless unique_references.has_key?(key)
            unique_references[key] = DocumentReference.new(
              referenced_by: document,
              referenced_type: reference[:object_type],
              referenced_id: reference[:object_id],
            )
          end
        end
      end
    end

    unique_references.values
  end

  private

  def self.references_from_blocknote(blocknote_document)
    assert blocknote_document.is_a?(Array), "BlockNote document should be an Array"

    all_references = []

    blocknote_document.each do |block|
      each_block(block, %w[mention advancedTable]) do |block|
        Sentry.set_context(
          "block", block
        )

        object_type = block.dig("props", "entity")

        if block.dig("type") == "mention" && %w[document table].include?(object_type)
          object_id = block.dig("props", "entityId")
          mention_id = block["props"]["id"]

          next if object_id.blank?

          all_references.push({
            id: mention_id,
            object_type: object_type.upcase_first,
            object_id: object_id,
          })
        elsif block.dig("type") == "advancedTable"
          object_id = block.dig("props", "tableNpi") || block.dig("props", "tableId")

          next if object_id.blank?

          all_references.push({
            id: block["id"],
            object_type: Table.to_s,
            object_id: object_id,
          })
        end
      end
    end

    all_references
  end

  def self.each_block(node, types, &block)
    return unless node.is_a? Hash

    if types.include?(node.dig("type"))
      yield node
    end
    node.each do |key, value|
      if key.is_a? Hash
        each_block(key, types, &block)
      end

      if value.is_a? Hash
        each_block(value, types, &block)
      elsif value.is_a? Array
        value.each { |elem| each_block(elem, types, &block) }
      end
    end
  end
end

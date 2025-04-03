ObjectReference = Struct.new(:object_title, :object_path, :object_type, :object_npi, :reference_id, :referenced_by, :created_at)

class ReferencesExtractor
  extend Rails.application.routes.url_helpers

  def self.all_references(documents)
    all_references_by_id = Hash.new

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

        references = references_from_blocknote(version.content)
        references.each do |reference|
          unless all_references_by_id.has_key?([version, reference[:object_path]])
            all_references_by_id[reference] = ObjectReference.new(
              referenced_by: document,
              created_at: version.created_at,
              object_type: reference[:object_type],
              object_npi: reference[:object_npi],
              object_title: reference[:object_title],
              object_path: reference[:object_path]
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
          unless all_references_by_id.has_key?([comment, reference[:object_path]])
            all_references_by_id[reference] = ObjectReference.new(
              referenced_by: comment,
              created_at: comment.created_at,
              object_type: reference[:object_type],
              object_npi: reference[:object_npi],
              object_title: reference[:object_title],
              object_path: reference[:object_path]
            )
          end
        end
      end
    end

    all_references_by_id.values
  end

  private

  def self.url_options
    Rails.application.config.action_mailer.default_url_options
  end

  def self.optimize_routes_generation?
    true
  end

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
          object_npi = block.dig("props", "entityId")
          mention_id = block["props"]["id"]

          next if object_npi.blank?

          all_references.push({
            reference_id: mention_id,
            object_type: object_type.upcase_first,
            object_npi: object_npi,
            object_path:
              object_type == "table" ?
                table_path(object_npi) :
                document_path(object_npi, anchor: "mention-#{mention_id}")
          })
        elsif block.dig("type") == "advancedTable"
          object_npi = block.dig("props", "tableNpi") || block.dig("props", "tableId")

          next if object_npi.blank?

          all_references.push({
            reference_id: block["id"],
            object_type: Table.to_s,
            object_id: object_npi,
            object_path: table_path(object_npi)
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

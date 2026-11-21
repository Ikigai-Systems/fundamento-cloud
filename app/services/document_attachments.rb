# The attachments a document's blocks point at, for a reader to know what it can open with Read
# Attachment. Built from the blocks, not from `document.attachments`: content can point at an
# attachment that belongs to another document, and the association still lists ones the content
# no longer mentions. Only the ones the reader may see are listed.
class DocumentAttachments
  def self.call(document:, blocks:, pundit_user:)
    references = BlocknoteBlocks.attachment_references(blocks)
    return [] if references.empty?

    found = Attachment.resolve_many(references.map { |reference| reference[:id] }, scope: document.organization.attachments)
      .includes(:parent, file_attachment: :blob)
      .index_by { |attachment| attachment.try(:npi) || attachment.id }
    found.merge!(found.values.index_by(&:id))

    references.filter_map do |reference|
      attachment = found[reference[:id]]
      next unless attachment && Pundit.policy!(pundit_user, attachment).show?

      {
        id: reference[:id],
        name: attachment.filename.presence || reference[:name],
        mime_type: attachment.mime_type,
        size: attachment.file.attached? ? attachment.file.blob.byte_size : nil,
        block_id: reference[:block_id]
      }
    end
  end
end

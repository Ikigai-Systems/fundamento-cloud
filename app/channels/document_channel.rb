class DocumentChannel < ApplicationCable::Channel
  include Y::Actioncable::Sync

  def initialize(connection, identifier, params = nil)
    super
    document_id = params[:documentId]
    load { |_| load_doc(document_id) }
  rescue
    logger.error "Could not load document sync for #{document_id}."
    # todo: consider clearing database record in such case...
    nil
  end

  def subscribed
    document_id = params[:documentId]
    document = find_document(document_id)

    unless document && authorized_to_update?(document)
      reject
      return
    end

    sync_from("document/#{document_id}") do |_|
      persist do |_, update|
        save_doc(document_id, update)
      end
    end
  end

  def receive(data)
    document_id = params[:documentId]
    sync("document/#{document_id}", data)
  end

  private

  def find_document(document_id)
    current_organization.documents.find_by(id: document_id)
  end

  def load_doc(document_id)
    data = find_document(document_id).sync
    data = data.unpack("C*") unless data.nil?
    data
  end

  def save_doc(document_id, update)
    document = find_document(document_id)

    return unless document && authorized_to_update?(document)

    document.update(sync: update.pack("C*"))
  rescue
    logger.error "Document sync #{document_id} could not be saved"
  end

  def authorized_to_update?(document)
    DocumentPolicy.new(pundit_user, document).update?
  end
end

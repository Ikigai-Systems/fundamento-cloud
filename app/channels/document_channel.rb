class DocumentChannel < ApplicationCable::Channel
  include Y::Actioncable::Sync

  def initialize(connection, identifier, params = nil)
    super
    document_id = params[:documentId]
    load { |_| load_doc(document_id) }
  rescue
    logger.error "Could not load document sync for ${documentId}."
    # todo: consider clearing database record in such case...
    nil
  end

  def subscribed
    document_id = params[:documentId]
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

  def load_doc(document_id)
    data = current_organization.documents.find(document_id)&.sync
    data = data.unpack("C*") unless data.nil?
    data
  end

  def save_doc(document_id, update)
    current_organization.documents.find(document_id).update(sync: update.pack("C*"))
  rescue
    logger.error "Document sync #{document_id} could not be saved. Update: #{update.pack("C*")}"
  end
end

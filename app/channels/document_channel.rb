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

    @editing_session = DocumentEditingSession.create!(
      document: document,
      member: current_membership,
      connected_at: Time.current
    )

    sync_from("document/#{document_id}") do |_|
      persist do |_, update|
        save_doc(document_id, update)
      end
    end
  end

  def receive(data)
    document_id = params[:documentId]
    sync("document/#{document_id}", data)

    if !@marked_as_edited && sync_message?(data)
      @editing_session&.update_columns(edited: true)
      @marked_as_edited = true
    end
  end

  def unsubscribed
    @editing_session&.update_columns(disconnected_at: Time.current)
  end

  private

  def find_document(document_id)
    current_organization.documents.find_by(id: document_id)
  end

  def current_membership
    @current_membership ||= OrganizationMembership.find_by!(
      organization: current_organization,
      user: current_user
    )
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

  # Y.js protocol message types (from y-protocols/sync)
  YJS_MESSAGE_SYNC = 0
  YJS_MESSAGE_AWARENESS = 1

  def sync_message?(data)
    update = data["update"]
    return false if update.blank?

    bytes = Y::Lib0::Decoding.decode_base64_to_uint8_array(update)
    decoder = Y::Lib0::Decoding.create_decoder(bytes)
    message_type = Y::Lib0::Decoding.read_var_uint(decoder)
    message_type == YJS_MESSAGE_SYNC
  rescue
    false
  end

  def authorized_to_update?(document)
    DocumentPolicy.new(pundit_user, document).update?
  end
end

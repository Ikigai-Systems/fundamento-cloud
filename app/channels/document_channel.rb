class DocumentChannel < ApplicationCable::Channel
  include Y::Actioncable::Sync

  # Hands a Yjs update made on the server (an edit through the API or MCP) to everyone editing
  # the document. Each connection's channel takes it into its own copy and persists that, and
  # passes it to its browser, which applies it next to whatever the person is typing.
  #
  # It goes out as the message a browser sends for its own edits. Those carry the sender's
  # connection as `origin`, and a channel does not pass a message back to the connection it came
  # from. This one has no sender, so `origin` is nil and no connection is skipped.
  #
  # Only the connections subscribed to this document's stream receive it. #subscribed admits a
  # connection only when its organization has the document and the user may update it, so the
  # message reaches no one else; the stream name carries no organization of its own.
  def self.broadcast_update(document_id, update)
    encoder = Y::Lib0::Encoding.create_encoder
    Y::Lib0::Encoding.write_var_uint(encoder, YJS_MESSAGE_SYNC)
    Y::Sync.write_update(encoder, update.bytes)
    message = Y::Lib0::Encoding.encode_uint8_array_to_base64(Y::Lib0::Encoding.to_uint8_array(encoder))

    ActionCable.server.broadcast("document/#{document_id}", {update: message, origin: nil})
  end

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

    begin
      @editing_session = DocumentEditingSession.create!(
        document: document,
        member: current_membership,
        connected_at: Time.current
      )
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
      Sentry.capture_exception(e, extra: {
        document_id: document_id,
        user_id: current_user.id,
        organization_id: current_organization.id
      })
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

    if !@marked_as_edited && sync_update_message?(data)
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
    data = find_document(document_id)&.content&.sync
    data = data.unpack("C*") unless data.nil?
    data
  end

  def save_doc(document_id, update)
    document = find_document(document_id)

    return unless document && authorized_to_update?(document)

    document.content_or_build.update(sync: update.pack("C*"))
  rescue
    logger.error "Document sync #{document_id} could not be saved"
  end

  # Y.js protocol message types (from y-protocols)
  YJS_MESSAGE_SYNC = 0

  # Y.js sync sub-types (from y-protocols/sync)
  YJS_SYNC_STEP1 = 0   # state vector request
  YJS_SYNC_STEP2 = 1   # initial document state
  YJS_SYNC_UPDATE = 2   # incremental document update

  def sync_update_message?(data)
    update = data["update"]
    return false if update.blank?

    bytes = Y::Lib0::Decoding.decode_base64_to_uint8_array(update)
    decoder = Y::Lib0::Decoding.create_decoder(bytes)
    message_type = Y::Lib0::Decoding.read_var_uint(decoder)
    return false unless message_type == YJS_MESSAGE_SYNC

    sync_type = Y::Lib0::Decoding.read_var_uint(decoder)
    sync_type == YJS_SYNC_UPDATE
  rescue StandardError
    false
  end

  def authorized_to_update?(document)
    DocumentPolicy.new(pundit_user, document).update?
  end
end

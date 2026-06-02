module ImportFileActions
  extend ActiveSupport::Concern

  private

  def confirm_file_upload(session, import_file)
    if params[:status] == "uploaded"
      if import_file.blob_signed_id.present?
        blob = ActiveStorage::Blob.find_signed!(import_file.blob_signed_id)
        import_file.file.attach(blob)
      end

      import_file.update!(status: :uploaded, uploaded_at: Time.current)
    end
  end
end

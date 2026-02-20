module Api
  module V1
    class ImportFilesController < Api::ApiController
      def update
        session = current_organization.import_sessions.find(params[:import_session_id])
        import_file = session.import_files.find(params[:id])

        authorize session, :update?

        if params[:status] == "uploaded"
          if import_file.blob_signed_id.present?
            blob = ActiveStorage::Blob.find_signed!(import_file.blob_signed_id)
            import_file.file.attach(blob)
          end

          import_file.update!(status: :uploaded, uploaded_at: Time.current)
          session.increment_counter!(:uploaded_files)
        end

        render json: {
          id: import_file.id,
          status: import_file.status,
          uploaded_at: import_file.uploaded_at
        }
      end
    end
  end
end

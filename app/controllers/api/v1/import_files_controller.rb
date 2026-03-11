module Api
  module V1
    class ImportFilesController < Api::ApiController
      include ImportFileActions

      def update
        session = current_organization.import_sessions.find(params[:import_session_id])
        import_file = session.import_files.find(params[:id])

        authorize session, :update?

        confirm_file_upload(session, import_file)

        render json: {
          id: import_file.id,
          status: import_file.status,
          uploaded_at: import_file.uploaded_at
        }
      end
    end
  end
end

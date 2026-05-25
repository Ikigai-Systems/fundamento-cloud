module Api
  module V1
    class ImportSessionsController < Api::ApiController
      include ImportSessionActions

      before_action :load_session, except: [:create]

      def create
        @session = build_import_session

        authorize @session

        @session.save!

        render json: session_json(@session), status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Space not found" }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def show
        authorize @session

        render json: session_json(@session).merge(
          files: @session.import_files.order(:relative_path).map { |f| file_json(f) }
        )
      end

      def destroy
        authorize @session

        @session.destroy!

        head :no_content
      end

      def manifest
        authorize @session, :update?

        render json: process_manifest(@session)
      end

      def trigger_processing
        authorize @session, :update?

        if (error = validate_and_trigger_processing(@session))
          return render json: { error: error }, status: :unprocessable_entity
        end

        render json: session_json(@session)
      end

      def retry_failed
        authorize @session, :update?

        # Include :processing files — they may be stuck from interrupted jobs
        retryable = @session.import_files.where(status: [:failed, :processing])
        retryable_count = retryable.count
        retryable.update_all(status: ImportFile.statuses[:uploaded], error_message: nil, processed_at: nil)

        @session.update!(
          status: :processing,
          completed_processing_at: nil,
          failed_files: [0, @session.failed_files - retryable_count].max,
          processed_files: [0, @session.processed_files - retryable_count].max
        )

        ImportSessionOrchestratorJob.perform_later(@session)

        render json: session_json(@session)
      end

      private

      def load_session
        @session = current_organization.import_sessions.find(params[:id])
      end

      def session_json(session)
        {
          id: session.id,
          status: session.status,
          source_format: session.source_format,
          total_files: session.total_files,
          uploaded_files: session.uploaded_files,
          processed_files: session.processed_files,
          failed_files: session.failed_files,
          skipped_files: session.skipped_files,
          expires_at: session.expires_at,
          started_processing_at: session.started_processing_at,
          completed_processing_at: session.completed_processing_at,
          created_at: session.created_at
        }
      end

      def file_json(file)
        {
          id: file.id,
          relative_path: file.relative_path,
          file_type: file.file_type,
          format: file.format,
          status: file.status,
          checksum: file.checksum,
          file_size: file.file_size,
          error_message: file.error_message,
          uploaded_at: file.uploaded_at,
          processed_at: file.processed_at,
          document_id: file.document_id
        }
      end
    end
  end
end

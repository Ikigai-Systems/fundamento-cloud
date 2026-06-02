class ImportSessionsController < ApplicationController
  include EnsureOrganization
  include ImportSessionActions

  after_action :verify_authorized

  before_action :set_session, only: [:show, :manifest, :trigger_processing, :retry_failed]

  def index
    @sessions = policy_scope(current_organization.import_sessions).recent
                  .includes(:space, :organization_membership)

    counts = ImportFile
      .where(import_session_id: @sessions.map(&:id))
      .group(:import_session_id, :status)
      .count
    @sessions.each { |s| s.preload_status_counts(counts) }

    authorize ImportSession, :index?
  end

  def show
    authorize @session, :show?

    @import_files = @session.import_files.order(:relative_path)
  end

  def new
    @session = current_organization.import_sessions.new
    @spaces = updatable_spaces

    authorize @session, :create?
  end

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

    retryable = @session.import_files.where(status: [:failed, :processing])
    retryable_count = retryable.count
    retryable.update_all(status: ImportFile.statuses[:uploaded], error_message: nil, processed_at: nil)

    @session.update!(status: :processing, completed_processing_at: nil)

    ImportSessionOrchestratorJob.perform_later(@session)

    redirect_to import_session_path(@session), notice: "Retrying #{retryable_count} failed files."
  end

  private

  def set_session
    @session = current_organization.import_sessions.find(params[:id])
  end

  def updatable_spaces
    policy_scope(current_organization.spaces.without_archived).select do |space|
      policy(space).update?
    end
  end

  def session_json(session)
    {
      id: session.id,
      status: session.status,
      source_format: session.source_format,
      total_files: session.total_files,
      uploaded_files: session.uploaded_files,
      processed_files: session.processed_files,
      failed_files: session.failed_files
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
      file_size: file.file_size
    }
  end
end

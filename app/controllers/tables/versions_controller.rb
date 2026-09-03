# Browsing and restoring a table's history. Deliberately shaped like
# Documents::VersionsController so the two histories behave the same way, minus #create:
# table versions are produced by coalescing edits, not by a save button.
class Tables::VersionsController < ApplicationController
  include EnsureOrganization

  layout -> { content_layout }

  include LoadTable.from_param(:table_id)

  after_action :verify_authorized

  before_action :load_table
  before_action :load_version, only: [:restore]

  def index
    authorize @table, :show?

    @versions = @table.versions.includes(:created_by).most_recent_first

    render layout: content_layout(full: "full_width_application", frame: "full_width_frame")
  end

  def show
    authorize @table, :show?

    @version = resolve_version

    # The history menu item is always clickable, so "latest" can land here before the
    # first version exists. The list explains what is coming; a 404 would not.
    return redirect_to table_versions_path(@table) if @version.nil? && params[:id] == "latest"
    raise ActionController::RoutingError, "Not Found" if @version.nil?

    @versions = @table.versions.includes(:created_by).most_recent_first
    @data = TableDataBlueprint.render(@version.reader.to_table_data) if @version.previewable?
  rescue Tables::SnapshotReader::UnsupportedFormat => e
    Sentry.capture_exception(e, extra: { table_version_id: @version.id })
    @data = nil
  end

  def restore
    authorize @table, :update?

    Tables::RestoreService.new(@table, @version).call

    redirect_to table_path(@table), notice: "Table has been restored to version #{@version.sequential_id}."
  end

  private

  def load_version
    @version = resolve_version

    raise ActionController::RoutingError, "Not Found" if @version.blank?
  end

  def resolve_version
    return @table.latest_version if params[:id] == "latest"

    @table.versions.find_by(sequential_id: params[:id])
  end

end

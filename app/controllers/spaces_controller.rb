class SpacesController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized, except: [:suggest_owners]

  include LoadSpace.from_param(:id)

  before_action :load_space, except: [:new, :index, :create, :suggest_owners]
  before_action :ensure_turbo_request, only: [:sidebar]

  helper_method :space_memberships_to_multiselect_value

  def index
    @spaces = policy_scope(current_organization.spaces).order(:name)

    authorize @spaces, :index?

    if turbo_frame_request?
      render partial: "spaces_tab", locals: { spaces: @spaces }
    end
  end

  def show
    authorize @space, :show?

    if @space.home_document.present?
      redirect_to document_url(@space.home_document)
    else
      @documents = @space.documents_from_hierarchy
      render layout: content_layout(full: "full_width_application", frame: "full_width_frame")
    end
  end

  def new
    @space = current_organization.spaces.new

    authorize @space, :create?
  end

  def create
    @space = current_organization.spaces.new(space_params.without(:space_memberships))

    authorize @space, :create?

    if @space.save # && @organization_membership.save
      update_space_memberships!(@space, space_params[:space_memberships])

      redirect_to @space, notice: 'Space was successfully created.', status: :see_other
    else
      render :new
    end
  end

  def edit
    authorize @space, :update?
  end

  def update
    authorize @space, :update?

    if @space.update(space_params.without(:space_memberships))
      update_space_memberships!(@space, space_params[:space_memberships])

      redirect_to spaces_path, notice: "Space was successfully updated.", status: :see_other
    else
      render :edit
    end
  end

  def archive
    authorize @space, :archive?
    @space.update!(archived: true)
    redirect_to spaces_path, notice: "Space was successfully archived.", status: :see_other
  end

  def unarchive
    authorize @space, :unarchive?
    @space.update!(archived: false)
    redirect_to spaces_path, notice: "Space was successfully unarchived.", status: :see_other
  end

  def reorder_hierarchy
    authorize @space, :update?

    document_id = params["document_id"]
    parent_id = params["parent_id"]
    position = params["position"].to_i

    # Validate that document_id is provided
    if document_id.blank?
      render json: { error: "document_id is required" }, status: :unprocessable_content
      return
    end

    # Validate that the document exists and belongs to this space
    document = @space.documents.find_by(id: document_id)
    unless document
      render json: { error: "Document not found or does not belong to this space" }, status: :unprocessable_content
      return
    end

    # Validate parent_id if provided
    if parent_id.present?
      parent_document = @space.documents.find_by(id: parent_id)
      unless parent_document
        render json: { error: "Parent document not found or does not belong to this space" }, status: :unprocessable_content
        return
      end

      # Prevent circular references - document cannot be its own parent
      if document_id == parent_id
        render json: { error: "Document cannot be its own parent" }, status: :unprocessable_content
        return
      end

      # Prevent moving a document under one of its descendants
      descendant_ids = @space.get_all_descendant_ids(document_id)
      if descendant_ids.include?(parent_id)
        render json: { error: "Cannot move document under one of its descendants" }, status: :unprocessable_content
        return
      end
    end

    hierarchy = @space.hierarchy

    removed_item = @space.remove_item_with_children_from_hierarchy!(document_id, hierarchy)

    unless removed_item
      render json: { error: "Document not found in hierarchy" }, status: :unprocessable_content
      return
    end

    parent_item = @space.add_item_to_hierarchy!(hierarchy, parent_id, removed_item, position)

    if @space.save
      head :ok
    else
      render json: @space.errors, status: :unprocessable_content
    end
  end

  def suggest_owners
    query = params[:q]
    preselects = params[:preselects].split(",")

    @organization_memberships = current_organization.organization_memberships.query(query).map do |organization_membership|
      {
        value: "#{organization_membership.class}|#{organization_membership.id}",
        text: organization_membership.user.display_name
      }
    end

    @teams = current_organization.teams.query(query).map do |team|
      {
        value: "#{team.class}|#{team.id}",
        text: team.name
      }
    end

    render json: (@organization_memberships + @teams).reject { preselects.include?(_1[:value]) }.sort_by { _1[:text] }
  end

  def sidebar
    authorize @space, :show?

    case params[:tab]
    when "hierarchy"
      @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || !document.draft? }
      @tables = policy_scope(@space.tables.lexicographically, policy_scope_class: DocumentPolicy::Scope)
      render template: "spaces/_sidebar/hierarchy"
    when "starred"
      @favorites = []
      render template: "spaces/_sidebar/starred"
    else
      # renders spaces/sidebar.html.erb (tab shell) — no data needed
    end
  end

  private

  def space_memberships_to_multiselect_value(space)
    space.space_memberships.map do |membership|
      { value: "#{membership.member_type}|#{membership.member_id}", text: membership.display_name }
    end.to_json
  end

  def update_space_memberships!(space, space_memberships_param)
    memberships_to_destroy = space.space_memberships.index_by { [_1.member_type, _1.member_id.to_s] }

    space_memberships_param.select(&:present?).each do |membership|
      member_type, member_id = membership.split("|")

      if memberships_to_destroy.key?([member_type, member_id])
        # If the membership already exists, remove it from the list of memberships to destroy and keep it in the database
        memberships_to_destroy.delete([member_type, member_id])
      else
        # Membership does not exist but should so create it
        space.space_memberships.create!(
          organization: current_organization,
          role: :manager,
          member_type: member_type,
          member_id: member_id,
        )
      end
    end

    # Destroy any memberships that were not in the list of memberships to keep
    memberships_to_destroy.each_value(&:destroy!)
  end

  def space_params
    params.require(:space).permit(:name, :access_mode, :home_document_id, :home_document_type, space_memberships: [])
  end

  def ensure_turbo_request
    redirect_to space_path(@space) unless turbo_frame_request?
  end
end

class SpacesController < ApplicationController

  after_action :verify_authorized, except: [:suggest_owners]

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
      render layout: "full_width_application"
    end
  end

  def new
    @space = current_organization.spaces.new

    authorize @space, :create?
  end

  def create
    @space = current_organization.spaces.new(space_params.without(:space_memberships))

    authorize @space, :create?

    if @space.save # && @organization_user.save
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

      redirect_to spaces_path, notice: 'Space was successfully updated.', status: :see_other
    else
      render :edit
    end
  end

  def reorder_hierarchy
    authorize @space, :update?

    document_id = params["document_id"].to_i
    parent_id = params["parent_id"]&.to_i
    position = params["position"].to_i

    hierarchy = @space.hierarchy

    removed_item = @space.remove_item_with_children_from_hierarchy!(document_id, hierarchy)

    parent_item = @space.add_item_to_hierarchy!(hierarchy, parent_id, removed_item, position)

    unless @space.save
      render json: @space.errors, status: :unprocessable_content
    end
  end

  def suggest_owners
    query = params[:q]
    preselects = params[:preselects].split(",")

    @organization_users = current_organization.organization_users.query(query).map do |organization_user|
      {
        value: "#{organization_user.class}|#{organization_user.id}",
        text: organization_user.user.display_name
      }
    end

    @teams = current_organization.teams.query(query).map do |team|
      {
        value: "#{team.class}|#{team.id}",
        text: team.name
      }
    end

    render json: (@organization_users + @teams).reject { preselects.include?(_1[:value]) }.sort_by { _1[:text] }
  end

  def sidebar
    authorize @space, :show?

    @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
    @tables = policy_scope(@space.tables.lexicographically, policy_scope_class: DocumentPolicy::Scope)
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

  def load_space
    @space = current_organization.spaces.find_by_npi!(params[:npi])
  end

  def ensure_turbo_request
    redirect_to space_path(@space) unless turbo_frame_request?
  end
end

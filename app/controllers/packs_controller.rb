# frozen_string_literal: true

class PacksController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized, except: [:suggest_members]

  helper_method :pack_memberships_to_multiselect_value

  def new
    @pack = current_organization.packs.new

    authorize @pack, :create?
  end

  def index
    @packs = current_organization.packs.order(:name)

    authorize @packs, :index?
  end

  def create
    @pack = current_organization.packs.new(pack_params)

    authorize @pack, :create?

    if @pack.save
      # update_pack_memberships!(@pack, params[:pack][:pack_memberships])

      redirect_to @pack, notice: 'Team was successfully created.'
    else
      render :new
    end
  end

  def update
    @pack = current_organization.packs.find(params[:id])

    authorize @pack, :update?

    if @pack.update(pack_params)
      # update_pack_memberships!(@pack, params[:pack][:pack_memberships])

      redirect_to @pack, notice: 'Team was successfully updated.'
    else
      render :edit
    end
  end

  def show
    @pack = current_organization.packs.find(params[:id])

    authorize @pack, :show?
  end

  def edit
    @pack = current_organization.packs.find(params[:id])

    authorize @pack, :update?
  end

  def destroy
    @pack = current_organization.packs.find_by(id: params[:id])

    authorize @pack, :destroy?

    @pack.destroy!

    redirect_to packs_path, notice: "Team was removed."
  end

  def suggest_members
    query = params[:q]
    preselects = params[:preselects].split(",")

    @organization_memberships = current_organization.organization_memberships.query(query).map do |organization_membership|
      {
        value: "#{organization_membership.class}|#{organization_membership.id}",
        text: organization_membership.user.display_name
      }
    end

    render json: @organization_memberships.reject { preselects.include?(_1[:value]) }.sort_by { _1[:text] }
  end

  private

  def update_pack_memberships!(pack, pack_memberships_param)
    memberships_to_destroy = pack.pack_memberships.index_by { [_1.member_type, _1.member_id.to_s] }

    pack_memberships_param.select(&:present?).each do |membership|
      member_type, member_id = membership.split("|")

      if memberships_to_destroy.key?([member_type, member_id])
        # If the membership already exists, remove it from the list of memberships to destroy and keep it in the database
        memberships_to_destroy.delete([member_type, member_id])
      else
        # Membership does not exist but should so create it
        pack.pack_memberships.create!(
          organization: current_organization,
          member_type: member_type,
          member_id: member_id,
        )
      end
    end

    # Destroy any memberships that were not in the list of memberships to keep
    memberships_to_destroy.each_value(&:destroy!)
  end

  def pack_memberships_to_multiselect_value(pack)
    pack.pack_memberships.map do |membership|
      { value: "#{membership.member_type}|#{membership.member_id}", text: membership.display_name }
    end.to_json
  end

  def pack_params
    params.require(:pack).permit(:name, :shortcut)
  end

end
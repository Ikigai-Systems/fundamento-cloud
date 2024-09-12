class SpacesController < ApplicationController

  after_action :verify_authorized

  def index
    @spaces = current_organization.spaces.order(:name)

    authorize @spaces, :index?
  end

  def show
    @space = current_organization.spaces.find_by_npi!(params[:npi])

    authorize @space, :show?

    if @space.home_document.present?
      redirect_to edit_space_document_url(@space, @space.home_document)
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
    @space = current_organization.spaces.new(space_params)

    authorize @space, :create?

    if @space.save # && @organization_user.save
      redirect_to @space, notice: 'Space was successfully created.', status: :see_other
    else
      render :new
    end
  end

  def edit
    @space = current_organization.spaces.find_by_npi!(params[:npi])

    authorize @space, :update?
  end

  def update
    @space = current_organization.spaces.find_by_npi!(params[:npi])

    authorize @space, :update?

    if @space.update(space_params)
      redirect_to spaces_path, notice: 'Space was successfully updated.', status: :see_other
    else
      render :edit
    end
  end

  def reorder_hierarchy
    @space = current_organization.spaces.find_by_npi!(params[:npi])

    authorize @space, :update?

    document_id = params["document_id"].to_i
    parent_id = params["parent_id"]&.to_i
    position = params["position"].to_i

    hierarchy = @space.hierarchy

    def remove_from_hierarchy(node, document_id)
      (node || []).each_with_index do |item, index|
        if item.is_a? Numeric
          if item == document_id
            node.delete_at(index)
            return item
          end
        else
          if item["id"] == document_id
            node.delete_at(index)
            return item
          else
            removed_item = remove_from_hierarchy(item["children"], document_id)
            return removed_item if removed_item.present?
          end
        end
      end
      nil
    end

    removed_item = remove_from_hierarchy(hierarchy, document_id)

    def add_to_hierarchy(node, item_to_add, parent_id, position, document_id)
      if document_id == parent_id
        node.insert(position, item_to_add)
        return node
      else
        (node || []).each_with_index do |item, index|
          if item.is_a? Numeric
            if item == parent_id
              new_item = {id: item, children: [item_to_add]}
              node[index] = new_item
              return new_item
            end
          else
            if item["id"] == parent_id
              item["children"].insert(position, item_to_add)
              return item
            else
              parent_item = add_to_hierarchy(item["children"], item_to_add, parent_id, position, item["id"])
              return parent_item if parent_item.present?
            end
          end
        end
        nil
      end
    end

    parent_item = add_to_hierarchy(hierarchy, removed_item, parent_id, position, nil)

    unless @space.save
      render json: @space.errors, status: :unprocessable_content
    end
  end

  private

  def space_params
    params.require(:space).permit(:name, :access_mode, :home_document_id, :home_document_type)
  end

end

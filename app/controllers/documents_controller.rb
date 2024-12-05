class DocumentsController < ApplicationController
  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "full_width_application" }

  after_action :verify_authorized_or_index_scoped

  before_action :load_document, except: [:new, :index, :create]
  before_action :ensure_turbo_request, only: [:select_destination, :move]

  def index
    respond_to do |format|
      format.json { render json: policy_scope(current_organization.documents), :except => [:sync] }
      format.all { head :unprocessable_content }
    end
  end

  def new
    @document = current_organization.documents.new
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @document.space = @space

    authorize @document, :create?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
  end

  def create
    @document = current_organization.documents.new(document_params)
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @document.space = @space

    authorize @document, :create?

    if @document.save
      @space.hierarchy.append(@space.create_hierarchy_node(@document.id))
      @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }

      if @space.save
        redirect_to edit_space_document_path(@space, @document)
      else
        render :new, status: :unprocessable_content
      end
    else
      render :new, status: :unprocessable_content
    end
  end

  def show
    authorize @document, :show?

    respond_to do |format|
      format.json { render json: @document, :except => [:sync] }
      format.html do
        @space = current_organization.spaces.find_by_npi!(params[:space_npi])

        if @space != @document.space
          redirect_to space_document_path(@document.space, @document)
          return
        end

        if @document.versions.empty?
          redirect_to edit_space_document_path(@space, @document)
          return
        end

        @version = @document.versions.latest
        @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
      end
      format.all { head :unprocessable_content }
    end
  end

  def edit
    authorize @document, :update?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])

    if @space != @document.space
      redirect_to edit_space_document_path(@document.space, @document)
      return
    end

    @documents = @space.documents_from_hierarchy.filter { |document| policy(document).update? || document.versions.present? }
  end

  def update
    authorize @document, :update?

    update_params = document_params

    @document.update!(update_params)

    if update_params[:archived].present?
      if update_params[:archived] == "true"
        redirect_to space_path(@document.space), notice: 'Document has been archived.'
      else
        redirect_to edit_space_document_path(@document.space, @document), notice: 'Document has been restored.'
      end
      return
    end

    respond_to do |format|
      format.json { render json: @document, :except => [:sync] }
      format.html { render action: 'edit' }
    end
  end

  def destroy
    authorize @document, :destroy?

    @document.destroy

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @space.remove_single_item_from_hierarchy!(params[:id])
    @space.save

    redirect_to space_path(@space), notice: 'Document was successfully deleted.'
  end

  def select_destination
    authorize @document, :show?
  end

  def move
    authorize @document, :show?

    # FIXME: should lock both spaces
    @document.transaction do
      @source_space = @document.space
      @destination_space = current_organization.spaces.find(document_move_params[:space_id])

      if !policy(@document).update? || !policy(@document.space).update?
        @document.errors.add(:base, "You're not authorized to update this space.")
      end

      unless policy(@destination_space).update?
        @document.errors.add(:space, "You're not authorized to update the destination space.")
      end

      if @document.errors.empty?
        # So far, so good, try to move it
        item_to_move = @source_space.remove_item_with_children_from_hierarchy!(@document.id)

        if item_to_move.nil?
          # Hierarchy didn't include the document, let's create a new node
          item_to_move = @destination_space.create_hierarchy_node(@document.id)
        end

        @destination_space.add_item_to_hierarchy!(@destination_space.hierarchy, nil, item_to_move)

        @source_space.documents_from_hierarchy([item_to_move]).each { |document| document.update!(space: @destination_space) }
      end

      if @document.errors.empty? && @source_space.save && @destination_space.save
        # FIXME: would be great to show notice here
        render turbo_stream: turbo_stream.redirect_to(space_document_path(@destination_space, @document))
      else
        render turbo_stream: turbo_stream.replace(
          "edit_document_#{@document.id}",
          partial: "select_destination_form",
          locals: {
            document: @document
          }
        ), status: :unprocessable_content
      end
    end
  end

  private

  def subtitle
    instance_variable_defined?(:@document) && @document.title
  end

  def load_document
    @document = current_organization.documents.find(params[:id])
  end

  def ensure_turbo_request
    redirect_to space_document_path(@document.space, @document) unless turbo_frame_request?
  end

  def document_params
    params.require(:document).permit(:title, :archived)
  end

  def document_move_params
    params.require(:document).permit(:space_id)
  end
end

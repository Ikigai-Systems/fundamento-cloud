# frozen_string_literal: true

class ImportsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized

  def new
    @document_import = current_organization.document_imports.new
    @spaces = updatable_spaces

    authorize @document_import, :create?
  end

  def create
    @document_import = current_organization.document_imports.build(document_import_params)
    @document_import.organization_user = current_organization_user

    authorize @document_import, :create?

    if @document_import.save
      redirect_to @document_import, notice: "Import started successfully. Your document will be ready shortly."
    else
      @spaces = updatable_spaces
      render :new, status: :unprocessable_content
    end
  end

  def show
    @document_import = current_organization.document_imports.find_by_param!(params[:npi])

    authorize @document_import, :show?
  end

  def index
    @document_imports = policy_scope(current_organization.document_imports).recent.includes(:space, :document, :organization_user)

    authorize DocumentImport, :index?
  end

  private

  def updatable_spaces
    policy_scope(current_organization.spaces).select do |space|
      policy(space).update?
    end
  end

  def document_import_params
    params.require(:document_import).permit(:space_id, :file)
  end
end
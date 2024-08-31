class PublicController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :ensure_organization_exists
  skip_before_action :select_current_organization
  skip_before_action :load_current_organization_from_cookie
  skip_before_action :ensure_space_exists

  def show
    @public_link = PublicLink.find_by_npi!(params[:npi])
    @object = @public_link.object

    if @object.is_a?(Document)
      render "document", locals: { document: @object }
    else
      render status: :unprocessable_content
    end
  end
end
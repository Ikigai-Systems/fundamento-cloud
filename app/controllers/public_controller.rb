class PublicController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :ensure_organization_exists
  skip_before_action :select_current_organization
  skip_before_action :load_current_organization_from_cookie
  skip_before_action :ensure_space_exists

  before_action :set_cache_headers
  before_action :set_security_headers

  def show
    @public_link = PublicLink.find_by_npi!(params[:npi])
    @object = @public_link.object

    if @object.is_a?(Document)
      render "document", locals: { document: @object }
    else
      render status: :unprocessable_content
    end
  end

  private

  def set_cache_headers
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
  end

  def set_security_headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
  end
end
class PublicController < ApplicationController
  include HeadersForPublicDocuments

  before_action :store_user_location!, if: :storable_location?

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
      render "document", locals: {
        document: @object,
        version: @object.versions.latest
      }
    else
      render status: :unprocessable_content
    end
  end

  def attachment
    @attachment = Attachment.find(params[:id])

    if @attachment.parent.present? && @attachment.parent.respond_to?(:public_link) && @attachment.parent.public_link.present?
      # If the attachment is associated with a document that has a public link, we allow anonymous access and ask politely not to cache it
      send_data @attachment.data, :type => @attachment.mime_type, :disposition => 'inline'
    else
      # Otherwise, we don't allow access to the attachment
      head :unauthorized
    end
  end

  private

  # Store current location so user can be redirected back after authentication
  def store_user_location!
    store_location_for(:user, request.fullpath)
  end

  # Don't store location for non-GET requests or AJAX requests
  def storable_location?
    request.get? && is_navigational_format? && !devise_controller? && !request.xhr? && current_user.nil?
  end
end
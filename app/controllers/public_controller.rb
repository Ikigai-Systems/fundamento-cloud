class PublicController < ApplicationController
  include HeadersForPublicDocuments

  before_action :store_user_location!, if: :storable_location?

  after_action :verify_authorized, except: [:attachment]

  before_action :set_cache_headers
  before_action :set_security_headers

  def show
    @public_link = PublicLink.find_by_npi!(params[:npi])
    
    authorize @public_link, :show?
    
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
      # Check authorization based on allowed_emails for the public link
      authorize @attachment.parent.public_link, :show?
      
      # If authorized, serve the attachment
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
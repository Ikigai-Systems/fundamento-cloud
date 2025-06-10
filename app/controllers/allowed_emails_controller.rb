class AllowedEmailsController < ApplicationController
  after_action :verify_authorized

  include ActionView::RecordIdentifier

  before_action :load_public_link

  def create
    authorize @public_link.object.space, :update?

    service = SharePublicLinkService.new(
      public_link: @public_link,
      email: params[:email],
      current_user: current_user
    )

    if service.valid?
      if service.email_already_allowed?
        render_form_with_error("Email already added")
      elsif service.call
        render_success
      else
        render_form_with_error("Failed to add email or send invitation")
      end
    else
      render_form_with_error("Invalid email address")
    end
  end

  def destroy
    authorize @public_link.object.space, :update?

    email = params[:email]
    
    if @public_link.allowed_emails.include?(email)
      @public_link.allowed_emails = @public_link.allowed_emails - [email]
      @public_link.updated_by = current_user
      
      if @public_link.save
        render turbo_stream: turbo_stream.replace(dom_id(@public_link, :allowed_emails),
          partial: "public_links/allowed_emails", locals: { public_link: @public_link })
      else
        render turbo_stream: turbo_stream.replace(dom_id(@public_link, :allowed_emails),
          partial: "public_links/allowed_emails", locals: { public_link: @public_link, error: "Failed to remove email" })
      end
    else
      head :not_found
    end
  end

  private

  def load_public_link
    @public_link = current_organization.public_links.find(params[:public_link_id])
  end

  def render_form_with_error(error_message)
    render turbo_stream: turbo_stream.replace(dom_id(@public_link, :allowed_emails_form),
      partial: "public_links/allowed_emails_form", locals: { public_link: @public_link, error: error_message })
  end

  def render_success
    render turbo_stream: turbo_stream.replace(dom_id(@public_link, :allowed_emails),
      partial: "public_links/allowed_emails", locals: { public_link: @public_link })
  end
end
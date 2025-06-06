class AllowedEmailsController < ApplicationController
  after_action :verify_authorized

  before_action :load_public_link

  def create
    authorize @public_link.object.space, :update?

    email = params[:email]&.strip&.downcase
    
    if email.present? && email.match?(Devise.email_regexp)
      unless @public_link.allowed_emails.include?(email)
        @public_link.allowed_emails = @public_link.allowed_emails + [email]
        @public_link.updated_by = current_user
        
        if @public_link.save
          render turbo_stream: turbo_stream.replace("public_link_#{@public_link.id}_allowed_emails", 
            partial: "public_links/allowed_emails", locals: { public_link: @public_link })
        else
          render turbo_stream: turbo_stream.replace("public_link_#{@public_link.id}_allowed_emails_form",
            partial: "public_links/allowed_emails_form", locals: { public_link: @public_link, error: "Failed to add email" })
        end
      else
        render turbo_stream: turbo_stream.replace("public_link_#{@public_link.id}_allowed_emails_form",
          partial: "public_links/allowed_emails_form", locals: { public_link: @public_link, error: "Email already added" })
      end
    else
      render turbo_stream: turbo_stream.replace("public_link_#{@public_link.id}_allowed_emails_form",
        partial: "public_links/allowed_emails_form", locals: { public_link: @public_link, error: "Invalid email address" })
    end
  end

  def destroy
    authorize @public_link.object.space, :update?

    email = params[:email]
    
    if @public_link.allowed_emails.include?(email)
      @public_link.allowed_emails = @public_link.allowed_emails - [email]
      @public_link.updated_by = current_user
      
      if @public_link.save
        render turbo_stream: turbo_stream.replace("public_link_#{@public_link.id}_allowed_emails", 
          partial: "public_links/allowed_emails", locals: { public_link: @public_link })
      else
        render turbo_stream: turbo_stream.replace("public_link_#{@public_link.id}_allowed_emails",
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
end
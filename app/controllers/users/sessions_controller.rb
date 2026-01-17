class Users::SessionsController < Devise::SessionsController
  # Override Devise's create method to handle both standalone and two-step flow
  def create
    # Standalone mode: use traditional email+password authentication
    if Flipper.enabled?(:standalone)
      super
      return
    end

    # Two-step flow for non-standalone mode
    authentication_method = params.dig(:user, :authentication_method)

    case authentication_method
    when "password"
      # Step 2: Password authentication
      super
    when "magic_link"
      # Step 2: Magic link request
      handle_magic_link_request
    else
      # Step 1: Email collection
      handle_email_step
    end
  end

  protected

  def after_sign_out_path_for(resource_name)
    if params[:return_to].present?
      params[:return_to]
    else
      super
    end
  end

  def handle_email_step
    email = params.dig(:user, :email)&.downcase&.strip

    # Always use new resource for form rendering (to avoid PATCH requests)
    self.resource = resource_class.new

    if email.blank?
      flash.now[:alert] = "Please enter your email address"
      render :new, status: :unprocessable_entity
      return
    end

    found_user = resource_class.find_for_authentication(email: email)

    unless found_user
      flash.now[:alert] = "We couldn't find an account with that email address"
      render :new, status: :unprocessable_entity
      return
    end

    # Route based on whether user has password
    if found_user.has_password?
      # User has password - show options page
      @email = email
      @show_auth_options = true
      render :new, status: :ok
    else
      # Passwordless user - send magic link immediately
      found_user.send_magic_link(remember_me: true)
      @email = email
      @magic_link_sent = true
      render :new, status: :ok
    end
  end

  def handle_magic_link_request
    email = params.dig(:user, :email)

    found_user = resource_class.find_for_authentication(email: email)

    if found_user
      # Use new resource for form rendering (to avoid PATCH requests)
      self.resource = resource_class.new
      found_user.send_magic_link(remember_me: params.dig(:user, :remember_me))
      @email = email
      @magic_link_sent = true
      render :new, status: :ok
    else
      self.resource = resource_class.new
      flash[:alert] = "Something went wrong"
      redirect_to new_user_session_path
    end
  end
end
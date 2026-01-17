class Users::SessionsController < Devise::SessionsController
  def new
    @show_authorization_options = !Flipper.enabled?(:standalone) && params.dig(:user, :authentication_method) == "password"

    super
  end

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
      # Step 2: Password authentication, will call new if it fails
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
    remember_me = params.dig(:user, :remember_me).to_b

    self.resource = resource_class.new(email: email, remember_me: remember_me)

    if resource.email.blank?
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
      # Pre-populate the resource with remember_me value
      @show_authorization_options = true
      render :new, status: :ok
    else
      # Passwordless user - send magic link immediately
      found_user.send_magic_link(remember_me: remember_me)

      render :magic_link_sent, status: :ok
    end
  end

  def handle_magic_link_request
    email = params.dig(:user, :email)&.downcase&.strip
    remember_me = params.dig(:user, :remember_me).to_b

    self.resource = resource_class.new(email: email, remember_me: remember_me)

    found_user = resource_class.find_for_authentication(email: email)

    if found_user
      found_user.send_magic_link(remember_me: remember_me)

      render :magic_link_sent, status: :ok
    else
      flash[:alert] = "Something went wrong"

      redirect_to new_user_session_path
    end
  end
end
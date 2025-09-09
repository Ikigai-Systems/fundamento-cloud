class Api::V1::UsersController < Api::ApiController
  skip_before_action :authenticate_user_from_api_token!
  before_action :authenticate_user_from_api_token_or_jwt!

  def show
    @user = User.find(params[:id])

    pundit_user = PolicyUserContext.new(current_organization_user.user, current_organization_user.organization)

    Pundit.authorize(pundit_user, @user, :show?)

    render json: @user
  rescue Pundit::NotAuthorizedError, ActiveRecord::RecordNotFound => e
    render json: "'#{params[:id]}' is invalid user reference", status: :not_found
  end

  private

  def authenticate_user_from_api_token_or_jwt!
    authorization_header = request.headers['Authorization']
    return throw(:warden) unless authorization_header.present?

    # Try API token authentication first (Bearer token)
    if authorization_header.start_with?("Bearer ")
      token = extract_bearer_token(authorization_header)
      api_token = ApiToken.find_by_encrypted_token(token)
      
      if api_token
        @current_user = api_token.organization_user.user
        RequestContext.current_organization = api_token.organization
        api_token.update!(used_at: Time.now)
        return
      end
    end

    # Try JWT authentication (JWT token)
    if authorization_header.start_with?("JWT ")
      begin
        token = extract_bearer_token(authorization_header, "JWT")
        jwt_secret_key = Rails.application.credentials.formula_eval.jwt_secret_key!
        payload, _headers = JWT.decode(token, jwt_secret_key, true, algorithm: "HS256")
        
        organization_user = GlobalID::Locator.locate payload["sub"]
        if organization_user
          @current_user = organization_user.user
          RequestContext.current_organization = organization_user.organization
          return
        end
      rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
        # Fall through to throw(:warden)
      end
    end

    throw(:warden)
  end
end
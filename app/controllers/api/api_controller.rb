module Api
  class ApiController < ActionController::Base
    skip_before_action :verify_authenticity_token

    before_action :authenticate_user_from_api_token!

    protected

    def authenticate_user_from_api_token!
      authorization_header = request.headers['Authorization']
      token = extract_bearer_token(authorization_header)

      throw(:warden) unless (api_token = ApiToken.find_by_encrypted_token(token))

      @current_user = api_token.organization_user.user
      RequestContext.current_organization = api_token.organization

      api_token.update!(used_at: Time.now)
    end

    def authenticate_user_from_jwt_token!
      authorization_header = request.headers['Authorization']
      token = extract_bearer_token(authorization_header, "JWT")

      jwt_secret_key = Rails.application.credentials.formula_eval.jwt_secret_key!

      payload, headers = JWT.decode(token, jwt_secret_key, true, algorithm: "HS256")

      organization_user = GlobalID::Locator.locate payload["sub"]
      # space = GlobalID::Locator.locate payload["aud"]

      throw(:warden) unless organization_user

      @current_user = organization_user.user
      RequestContext.current_organization = organization_user.organization
    end

    def current_organization
      RequestContext.current_organization
    end

    def pundit_user
      PolicyUserContext.new(current_user, current_organization)
    end

    # TODO: In the future implement this as devise scope, the same way we handle Superintendents
    def current_organization_user
      pundit_user&.organization_user
    end

    def extract_bearer_token(authorization_header, token_type = "Bearer")
      return nil unless authorization_header.present? && authorization_header.start_with?("#{token_type} ")

      authorization_header.split(" ").last
    end
  end
end
module Api
  class ApiController < ActionController::Base
    skip_before_action :verify_authenticity_token

    before_action :authenticate_user_from_token!

    protected

    def authenticate_user_from_token!
      authorization_header = request.headers['Authorization']
      token = extract_bearer_token(authorization_header)

      throw(:warden) unless (api_token = ApiToken.find_by_encrypted_token(token))

      @current_user = api_token.organization_user.user
      RequestContext.current_organization = api_token.organization

      api_token.update!(used_at: Time.now)
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

    def extract_bearer_token(authorization_header)
      return nil unless authorization_header.present? && authorization_header.start_with?("Bearer ")

      authorization_header.split(" ").last
    end
  end
end
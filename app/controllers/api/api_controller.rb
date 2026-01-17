module Api
  class ApiController < ActionController::Base
    include Pundit::Authorization

    skip_before_action :verify_authenticity_token

    before_action :authenticate_user_from_headers!

    rescue_from Pundit::NotAuthorizedError do |_exception|
      head :forbidden
    end

    protected

    def authenticate_user_from_headers!
      request.env["warden"].authenticate!(:api_token, :jwt, scope: :user)
    end

    def authenticate_user_from_api_token!
      request.env["warden"].authenticate!(:api_token, scope: :user)
    end

    def authenticate_user_from_jwt!
      request.env["warden"].authenticate!(:jwt, scope: :user)
    end

    def current_organization
      RequestContext.current_organization
    end

    def pundit_user
      PolicyUserContext.new(current_user, current_organization)
    end

    # TODO: In the future implement this as devise scope, the same way we handle Superintendents
    def current_organization_membership
      pundit_user&.organization_membership
    end
  end
end
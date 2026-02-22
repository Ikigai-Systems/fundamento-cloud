# frozen_string_literal: true

# Development-only middleware that allows instant sign-in via ?as=<email> query parameter.
# Strips the parameter and redirects to the clean URL after signing in.
#
# Usage: http://localhost:3000/?as=sarah@brightpath.example.com
# Usage: http://localhost:3000/some/path?as=sarah@brightpath.example.com
class WardenSignInBackdoorForDevelopment
  def initialize(app)
    @app = app
  end

  def call(env)
    return @app.call(env) unless Rails.env.development?

    request = Rack::Request.new(env)
    email = request.params["as"]

    if email.present?
      user = User.find_by(email: email)
      if user
        env["warden"].set_user(user, scope: :user)

        # Strip the ?as= param and redirect to the clean URL
        clean_url = remove_param(request.url, "as")
        return [302, { "Location" => clean_url, "Content-Type" => "text/html" }, ["Redirecting..."]]
      else
        Rails.logger.warn "[WardenSignInBackdoorForDevelopment] No user found for email: #{email}"
      end
    end

    @app.call(env)
  end

  private

  def remove_param(url, param_name)
    uri = URI.parse(url)
    params = Rack::Utils.parse_query(uri.query)
    params.delete(param_name)
    uri.query = params.empty? ? nil : Rack::Utils.build_query(params)
    uri.to_s
  end
end

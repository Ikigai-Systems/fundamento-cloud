require "rails_helper"
require "middleware/warden_sign_in_backdoor_for_development"

RSpec.describe WardenSignInBackdoorForDevelopment do
  let(:inner_app) { ->(env) { [200, { "Content-Type" => "text/html" }, ["OK"]] } }
  let(:middleware) { described_class.new(inner_app) }
  let(:warden) { double("warden") }

  def env_for(url, warden_double: warden)
    Rack::MockRequest.env_for(url).tap do |env|
      env["warden"] = warden_double
    end
  end

  before do
    allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("development"))
  end

  describe "#call" do
    context "when no ?as= parameter is present" do
      it "passes through to the inner app" do
        status, _headers, body = middleware.call(env_for("http://localhost:3000/"))

        expect(status).to eq(200)
        expect(body).to eq(["OK"])
      end
    end

    context "when ?as= parameter is present with a valid email" do
      let!(:user) do
        User.create!(
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          password: "password",
          confirmed_at: Time.current
        )
      end

      it "signs in the user and redirects to the clean URL" do
        allow(warden).to receive(:set_user)

        status, headers, _body = middleware.call(env_for("http://localhost:3000/?as=test@example.com"))

        expect(warden).to have_received(:set_user).with(user, scope: :user)
        expect(status).to eq(302)
        expect(headers["Location"]).to eq("http://localhost:3000/")
      end

      it "preserves other query parameters when redirecting" do
        allow(warden).to receive(:set_user)

        status, headers, _body = middleware.call(env_for("http://localhost:3000/some/path?foo=bar&as=test@example.com&baz=qux"))

        expect(status).to eq(302)
        expect(headers["Location"]).to include("foo=bar")
        expect(headers["Location"]).to include("baz=qux")
        expect(headers["Location"]).not_to include("as=")
      end
    end

    context "when ?as= parameter has an email that is not found" do
      it "logs a warning and passes through to the inner app" do
        allow(Rails.logger).to receive(:warn)

        status, _headers, body = middleware.call(env_for("http://localhost:3000/?as=nobody@example.com"))

        expect(Rails.logger).to have_received(:warn).with(/No user found for email: nobody@example.com/)
        expect(status).to eq(200)
        expect(body).to eq(["OK"])
      end
    end

    context "when not in development environment" do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("test"))
      end

      it "does not sign in and passes through to the inner app" do
        status, _headers, body = middleware.call(env_for("http://localhost:3000/?as=test@example.com"))

        expect(status).to eq(200)
        expect(body).to eq(["OK"])
      end
    end
  end
end

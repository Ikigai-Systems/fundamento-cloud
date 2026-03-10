require "rails_helper"

RSpec.describe RedditConversionService do
  let(:service) { described_class.new }

  describe ".enabled?" do
    it "returns true when both pixel_id and conversion_access_token are configured" do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return("pixel123")
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return("token123")

      expect(described_class.enabled?).to be true
    end

    it "returns false when pixel_id is missing" do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return(nil)
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return("token123")

      expect(described_class.enabled?).to be false
    end

    it "returns false when conversion_access_token is missing" do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return("pixel123")
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return(nil)

      expect(described_class.enabled?).to be false
    end
  end

  describe "#send_event" do
    let(:event_params) do
      {
        event_type: "SignUp",
        email: "user@example.com",
        click_id: "rdt_abc123",
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0",
        conversion_id: "conv_123"
      }
    end

    let(:success_response) { instance_double(Net::HTTPOK, is_a?: true) }
    let(:error_response) { instance_double(Net::HTTPInternalServerError, code: "500", body: '{"error": "internal"}') }
    let(:request_body) { nil }

    before do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return("pixel123")
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return("token123")

      allow(Net::HTTP).to receive(:post) do |_uri, body, _headers|
        @captured_body = body
        success_response
      end

      allow(success_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
      allow(error_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
    end

    it "sends a POST request to Reddit CAPI v3 with correct payload" do
      service.send_event(**event_params)

      expect(Net::HTTP).to have_received(:post).with(
        URI("https://ads-api.reddit.com/api/v3/conversions/events/pixel123"),
        anything,
        hash_including(
          "Authorization" => "Bearer token123",
          "Content-Type" => "application/json"
        )
      )

      body = JSON.parse(@captured_body)
      event = body["events"][0]
      expect(event["event_type"]).to eq({ "tracking_type" => "SignUp" })
      expect(event["user"]["email"]).to eq(Digest::SHA256.hexdigest("user@example.com"))
      expect(event["user"]["ip_address"]).to eq("1.2.3.4")
      expect(event["user"]["user_agent"]).to eq("Mozilla/5.0")
      expect(event["click_id"]).to eq("rdt_abc123")
      expect(event["event_metadata"]["conversion_id"]).to eq("conv_123")
    end

    it "hashes email as lowercase SHA256" do
      service.send_event(**event_params.merge(email: "User@Example.COM"))

      body = JSON.parse(@captured_body)
      expect(body["events"][0]["user"]["email"]).to eq(Digest::SHA256.hexdigest("user@example.com"))
    end

    it "omits click_id when nil" do
      service.send_event(**event_params.merge(click_id: nil))

      body = JSON.parse(@captured_body)
      expect(body["events"][0]).not_to have_key("click_id")
    end

    it "raises an error on non-2xx response" do
      allow(Net::HTTP).to receive(:post).and_return(error_response)

      expect { service.send_event(**event_params) }.to raise_error(RedditConversionService::ApiError)
    end
  end
end

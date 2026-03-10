require "rails_helper"

RSpec.describe RedditConversionJob, type: :job do
  fixtures :users

  let(:user) { users(:pawel) }

  describe "before_enqueue guard" do
    it "does not enqueue when RedditConversionService is disabled" do
      allow(RedditConversionService).to receive(:enabled?).and_return(false)

      expect {
        described_class.perform_later(
          event_type: "SignUp",
          user_id: user.id,
          ip_address: "1.2.3.4",
          user_agent: "Mozilla/5.0"
        )
      }.not_to have_enqueued_job(described_class)
    end

    it "enqueues when RedditConversionService is enabled" do
      allow(RedditConversionService).to receive(:enabled?).and_return(true)

      expect {
        described_class.perform_later(
          event_type: "SignUp",
          user_id: user.id,
          ip_address: "1.2.3.4",
          user_agent: "Mozilla/5.0"
        )
      }.to have_enqueued_job(described_class)
    end
  end

  describe "#perform" do
    let(:service) { instance_double(RedditConversionService) }

    before do
      allow(RedditConversionService).to receive(:new).and_return(service)
      allow(RedditConversionService).to receive(:enabled?).and_return(true)
    end

    it "calls the service with correct parameters for SignUp" do
      expect(service).to receive(:send_event).with(
        event_type: "SignUp",
        email: user.email,
        click_id: user.reddit_click_id,
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0",
        conversion_id: anything
      )

      described_class.perform_now(
        event_type: "SignUp",
        user_id: user.id,
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0"
      )
    end

    it "silently discards if user is not found" do
      expect(service).not_to receive(:send_event)

      described_class.perform_now(
        event_type: "SignUp",
        user_id: "nonexistent",
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0"
      )
    end
  end
end

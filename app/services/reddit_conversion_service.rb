class RedditConversionService
  API_BASE_URL = "https://ads-api.reddit.com/api/v3/conversions/events"

  class ApiError < StandardError; end

  def self.enabled?
    pixel_id.present? && conversion_access_token.present?
  end

  def send_event(event_type:, email:, ip_address:, user_agent:, click_id: nil, conversion_id: nil)
    uri = URI("#{API_BASE_URL}/#{self.class.pixel_id}")

    event = {
      "event_at" => Time.current.iso8601,
      "event_type" => { "tracking_type" => event_type },
      "user" => {
        "email" => Digest::SHA256.hexdigest(email.downcase),
        "ip_address" => ip_address,
        "user_agent" => user_agent
      },
      "event_metadata" => { "conversion_id" => conversion_id || SecureRandom.uuid }
    }
    event["click_id"] = click_id if click_id.present?

    response = Net::HTTP.post(
      uri,
      { "events" => [event] }.to_json,
      "Authorization" => "Bearer #{self.class.conversion_access_token}",
      "Content-Type" => "application/json"
    )

    unless response.is_a?(Net::HTTPSuccess)
      raise ApiError, "Reddit CAPI returned #{response.code}: #{response.body}"
    end

    response
  end

  private

  def self.pixel_id
    Rails.application.credentials.dig(:reddit, :pixel_id)
  end

  def self.conversion_access_token
    Rails.application.credentials.dig(:reddit, :conversion_access_token)
  end
end

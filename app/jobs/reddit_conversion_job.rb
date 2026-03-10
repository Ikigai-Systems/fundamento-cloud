class RedditConversionJob < ApplicationJob
  before_enqueue do |job|
    throw :abort unless RedditConversionService.enabled?
  end

  retry_on RedditConversionService::ApiError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  def perform(event_type:, user_id:, ip_address:, user_agent:)
    user = User.find_by(id: user_id)
    return unless user

    RedditConversionService.new.send_event(
      event_type: event_type,
      email: user.email,
      click_id: user.reddit_click_id,
      ip_address: ip_address,
      user_agent: user_agent,
      conversion_id: "#{event_type}_#{user_id}_#{Time.current.to_i}"
    )
  end
end

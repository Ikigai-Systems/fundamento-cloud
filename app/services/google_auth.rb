class GoogleAuth
  def self.enabled?
    Rails.application.credentials.dig(:google, :client_id).present? &&
      Rails.application.credentials.dig(:google, :client_secret).present?
  end
end

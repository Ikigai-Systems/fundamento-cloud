class Analytics::IngestController < ActionController::Base
  skip_forgery_protection

  POSTHOG_API_HOST = "https://eu.i.posthog.com"
  POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com"

  def proxy
    if request.post? && request.content_length.to_i > 1.megabyte
      return head :payload_too_large
    end

    target_host = if request.path.start_with?("/ingest/static/")
      POSTHOG_ASSETS_HOST
    else
      POSTHOG_API_HOST
    end

    path = request.path.sub(%r{^/ingest}, "")
    target_url = "#{target_host}#{path}"
    target_url += "?#{request.query_string}" if request.query_string.present?

    uri = URI(target_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 5
    http.read_timeout = 10

    upstream_request = if request.get?
      Net::HTTP::Get.new(uri)
    else
      req = Net::HTTP::Post.new(uri)
      req["Content-Type"] = request.content_type || "application/json"
      req.body = request.raw_post
      req
    end

    upstream_request["X-Forwarded-For"] = request.remote_ip

    response = http.request(upstream_request)
    render body: response.body, status: response.code.to_i, content_type: response["Content-Type"]
  rescue StandardError => e
    Rails.logger.warn("PostHog proxy error: #{e.class} - #{e.message}")
    head :bad_gateway
  end
end

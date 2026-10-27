module CookieHelpers
  # Helper to set an encrypted organization cookie before a request
  def set_organization_id_cookie(organization_id)
    jar = ActionDispatch::Cookies::CookieJar.build(request, cookies.to_hash)
    jar.encrypted[:organization_id] = organization_id
    cookies[:organization_id] = jar[:organization_id]
  end

  # Helper to get the current organization_id from encrypted cookies
  def current_organization_id_from_cookie
    jar = ActionDispatch::Cookies::CookieJar.build(request, cookies.to_hash)
    jar.encrypted[:organization_id]
  end

  # Expiry the last response gave a cookie, or nil for a cookie that lasts only the browser session
  def response_cookie_expiry(name)
    line = Array(response.headers["Set-Cookie"]).flat_map { it.split("\n") }.find { it.start_with?("#{name}=") }
    raise "response sets no #{name} cookie" unless line

    expires = line[/expires=([^;]+)/i, 1]
    expires && Time.httpdate(expires)
  end
end

RSpec.configure do |config|
  config.include CookieHelpers, type: :request
end


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
end

RSpec.configure do |config|
  config.include CookieHelpers, type: :request
end


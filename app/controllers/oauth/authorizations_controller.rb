# frozen_string_literal: true

class Oauth::AuthorizationsController < Doorkeeper::AuthorizationsController
  layout "oauth"

  before_action :ensure_organization_selected!, only: [:new, :create]

  helper_method :selected_organization

  private

  MCP_ORGANIZATION_PATH = %r{\A/api/mcp/organizations/(?<id>[^/]+)\z}

  # An MCP URL naming an organization selects it, and is refused rather than swapped for
  # another when the user isn't a member. Otherwise: if the user has one org, auto-select it.
  # If they have multiple, send them to the org picker which stores the choice in session and
  # redirects back here. Session key is scoped to the OAuth state so each flow is independent.
  def ensure_organization_selected!
    memberships = current_resource_owner.organization_memberships

    if requested_organization_id
      membership = memberships.find_by(organization_id: requested_organization_id)
      return render(:organization_unavailable, status: :forbidden) unless membership

      session[oauth_organization_membership_session_key] = membership.id
    elsif memberships.one?
      session[oauth_organization_membership_session_key] = memberships.first.id
    elsif session[oauth_organization_membership_session_key].blank?
      redirect_to oauth_pick_organization_path(return_to: request.fullpath, oauth_state: params[:state])
    end
  end

  # MCP clients send the URL they connect to as the RFC 8707 `resource` parameter.
  # Doorkeeper ignores it. Only a URL on this host counts.
  def requested_organization_id
    resource = params[:resource]
    return unless resource.is_a?(String)

    uri = URI.parse(resource)
    uri.path[MCP_ORGANIZATION_PATH, :id] if uri.is_a?(URI::HTTP) && uri.origin == request.base_url
  rescue URI::InvalidURIError
    nil
  end

  def oauth_organization_membership_session_key
    "oauth_organization_membership_#{params[:state]}"
  end

  # Doorkeeper copies custom_access_token_attributes onto the grant straight from the
  # request, so the membership is replaced with the one chosen server-side, and only
  # when it belongs to the approving user.
  def pre_auth_params
    super.merge(organization_membership_id: selected_organization_membership&.id)
  end

  def selected_organization
    selected_organization_membership&.organization
  end

  def selected_organization_membership
    current_resource_owner.organization_memberships.find_by(id: session[oauth_organization_membership_session_key])
  end
end

class RootController < ApplicationController
  include EnsureOrganization

  def index
    @mentions = MentionsExtractor::get_all_mentions(policy_scope(current_organization.documents), current_user)
                  .sort_by { |mention| mention.created_at }.reverse

    last_mention_seen_at_property = current_organization_user.organization_user_properties.find_by_key("last_mention_seen_at")
    @last_mention_seen_at = last_mention_seen_at_property&.value&.to_datetime
  end

  def recently_updated
    @recently_updated = policy_scope(current_organization.documents).recently_updated
    @recently_updated += policy_scope(current_organization.tables).recently_updated
    @recently_updated.sort_by!(&:updated_at).reverse!.slice!(51..)
  end

  def notifications
  end
end

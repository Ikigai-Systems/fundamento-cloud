class RootController < ApplicationController
  def index
    @mentions_count = MentionsExtractor::get_all_mentions(policy_scope(current_organization.documents), current_user).count
  end
end

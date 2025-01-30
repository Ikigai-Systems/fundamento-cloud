class RootController < ApplicationController
  def index
    @mentions = MentionsExtractor::get_all_mentions(policy_scope(current_organization.documents), current_user)
  end
end

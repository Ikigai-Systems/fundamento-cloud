class MentionsController < ApplicationController
  after_action :verify_authorized, except: [:index]

  def index
    @mentions = MentionsExtractor::get_all_mentions(policy_scope(current_organization.documents), current_user)
                  .sort_by { |mention| mention[:version].created_at }.reverse

    respond_to do |format|
      format.html { render partial: "mentions_tab" }
    end
  end
end
class TagsController < ApplicationController
  include EnsureOrganization
  include LoadSpace.from_param(:space_id)

  after_action :verify_authorized

  before_action :load_space

  def suggest
    authorize @space, :show?

    query = params[:q]
    preselects = params[:preselects]&.split(",")

    tags = @space.tags.query(query).map do |tag|
      {
        value: tag.hashtag,
        text: tag.hashtag
      }
    end

    render json: tags.reject { preselects&.include?(_1[:value]) }.sort_by { _1[:text] }
  end
end
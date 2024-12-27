class Documents::ReactionsController < ApplicationController
  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "content_two_sidebars" }

  include LoadDocument

  after_action :verify_authorized

  before_action :load_document

  def create
    authorize @document, :show?
  end
end

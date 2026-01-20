class Objects::TagsController < ApplicationController
  include EnsureOrganization

  include LoadDocument.from_param(:document_id)
  include LoadTable.from_param(:table_id)

  after_action :verify_authorized

  before_action :load_document, if: -> { params[:document_id].present? }
  before_action :load_table, if: -> { params[:table_id].present? }
  before_action -> { @object = @document || @table }

  def create
    authorize @object, :update?

    tags_service = TagsService.new(object: @object, organization: current_organization)

    tags = tags_service.update_tags(params[:tags]).map do
      {
        :text => _1.hashtag,
        :value => _1.hashtag
      }
    end

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace([@object, :tags], SidebarTags.new(object: @object))
      end
    end
  end
end
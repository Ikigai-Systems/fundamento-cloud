class SearchesController < ApplicationController
  include EnsureOrganization

  # maybe this should go to controllers/api/v1, I dunno

  include Pundit::Authorization

  after_action :verify_policy_scoped

  def show
    # todo: later query for other entities as well (spaces, organizations, etc) and respect 'query' param to narrow down searches

    @results = []

    @results += policy_scope(current_organization.documents).map do |document|
      parent_path = ""
      parent = document.parent

      while parent.present?
        parent_path = "#{parent.title} › #{parent_path}"
        parent = parent.parent
      end

      {
        object: {
          npi: document.id,
          id: document.id,
          title: document.title,
          parent_path: parent_path,
          type: document.class.to_s,
        },
        space: {
          name: document.space.name,
        }
      }
    end

    @results += policy_scope(current_organization.tables).map do |table|
      parent_path = ""

      # parent = table.parent
      #
      # while parent.present?
      #   parent_path = "#{parent.title} › #{parent_path}"
      #   parent = parent.parent
      # end

      {
        object: {
          npi: table.id,
          id: table.id,
          title: table.name,
          parent_path: parent_path,
          type: table.class.to_s,
        },
        space: {
          name: table.space.name,
        }
      }
    end

    respond_to do |format|
      format.json { render json: @results }
      format.all { head :unprocessable_content }
    end
  end
end

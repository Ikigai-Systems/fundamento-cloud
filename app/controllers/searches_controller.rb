class SearchesController < ApplicationController
  include EnsureOrganization

  # maybe this should go to controllers/api/v1, I dunno

  include Pundit::Authorization

  after_action :verify_policy_scoped

  # The palette is a jump-to tool, not a results page: past a couple of dozen rows nobody
  # scrolls, they refine the query. The cap also bounds the payload and the shadow-DOM
  # re-render, which used to grow with the size of the whole organization.
  PER_TYPE_LIMIT = 25
  RESULT_LIMIT = 50

  def show
    respond_to do |format|
      format.json { render json: results }
      format.all { head :unprocessable_content }
    end
  end

  private

  def query
    @query ||= params[:q].to_s.strip
  end

  # Never `select *`: documents.sync is the Y.js CRDT blob, megabytes per space, and the
  # palette never looks at it. HasIcon::COLUMNS is named rather than restated so a narrowed
  # select cannot forget the icon.
  def documents
    @documents ||= policy_scope(current_organization.documents)
      .without_archived
      .where(space_id: unarchived_space_ids)
      .matching_title(query)
      .select(:id, :title, :space_id, :updated_at, *HasIcon::COLUMNS)
      .limit(PER_TYPE_LIMIT)
      .to_a
  end

  def tables
    @tables ||= policy_scope(current_organization.tables)
      .without_archived
      .where(space_id: unarchived_space_ids)
      .matching_title(query)
      .select(:id, :name, :space_id, :updated_at, *HasIcon::COLUMNS)
      .limit(PER_TYPE_LIMIT)
      .to_a
  end

  def spaces
    @spaces ||= policy_scope(current_organization.spaces)
      .without_archived
      .matching_title(query)
      .select(:id, :name, :updated_at, *HasIcon::COLUMNS)
      .limit(PER_TYPE_LIMIT)
      .to_a
  end

  # SpacePolicy::Scope returns `scope.all` for a manager, without the `.without_archived`
  # its member branch applies -- so a manager's palette would otherwise surface documents
  # and tables living inside archived spaces. Filtering here rather than in the policy keeps
  # the fix local: that scope is shared with the spaces index and the sidebar, which have
  # their own reasons to see archived spaces.
  def unarchived_space_ids
    @unarchived_space_ids ||= current_organization.spaces.without_archived.select(:id)
  end

  def results
    ranked = (documents + tables + spaces)
      .sort_by { |record| [rank(record), -record.updated_at.to_i] }
      .first(RESULT_LIMIT)

    paths = HierarchyPaths.new(
      spaces: containing_spaces.values,
      document_ids: ranked.grep(Document).map(&:id)
    )

    ranked.map { |record| payload_for(record, paths) }
  end

  # Exact match first, then prefix, then plain substring -- so a table or a space can
  # outrank a document that only matches in the middle of its title.
  def rank(record)
    title = record.title.to_s.downcase
    needle = query.downcase

    return 0 if title == needle
    return 1 if title.start_with?(needle)

    2
  end

  # One query for the names *and* the hierarchies the parent paths are built from.
  #
  # Deliberately not policy_scoped: these ids are already the output of
  # DocumentPolicy::Scope / TablePolicy::Scope, both defined as
  # `scope.where(space: Pundit.policy_scope!(user_context, Space))`, so re-scoping would
  # only issue the same subquery a second time.
  def containing_spaces
    @containing_spaces ||= begin
      ids = (documents + tables).map(&:space_id).uniq

      if ids.empty?
        {}
      else
        current_organization.spaces.where(id: ids).select(:id, :name, :hierarchy).index_by(&:id)
      end
    end
  end

  # The key names are the client's contract: js-from-routes camelCases the response, so
  # `parent_path` is read as `object.parentPath` in command_palette_controller.js.
  #
  # Only documents get a parent path. Document hierarchy lives entirely in
  # spaces.hierarchy, whose nodes are document ids -- a table or a space has no position in
  # that tree, so "" is the only honest answer for them.
  def payload_for(record, paths)
    {
      object: {
        id: record.id,
        title: record.title,
        icon: record.icon,
        parent_path: record.is_a?(Document) ? paths.path_for(record.id) : "",
        type: record.class.to_s,
      },
      space: {
        name: record.is_a?(Space) ? nil : containing_spaces[record.space_id]&.name,
      }
    }
  end
end

class Formula::TableLookup
  class AmbiguousTable < StandardError; end

  def initialize(space:, pundit_user:)
    @space = space
    @pundit_user = pundit_user
  end

  def find!(identifier)
    table = @space ? find_in_space(identifier) : find_in_organization(identifier)

    raise ActiveRecord::RecordNotFound, "Table not found: #{identifier}" unless table

    Pundit.authorize(@pundit_user, table, :show?)

    table
  end

  private

  def find_in_space(identifier)
    @space.tables.find_by(id: identifier) || @space.tables.find_by(name: identifier)
  end

  def find_in_organization(identifier)
    organization = @pundit_user.current_organization
    by_id = organization.tables.find_by(id: identifier)
    return by_id if by_id

    matches = organization.tables.where(name: identifier).to_a
    if matches.size > 1
      raise AmbiguousTable,
        "Multiple tables named '#{identifier}' exist in the organization; specify a space"
    end

    matches.first
  end
end

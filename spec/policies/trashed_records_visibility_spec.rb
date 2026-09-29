require "rails_helper"

# Trashing is only safe if a trashed record stops being *visible*, not merely
# undeletable. Almost every list a user sees -- the dashboard's recently-updated,
# mentions, search, the API index, the MCP tools -- is built from
# `policy_scope(current_organization.documents)` or the tables equivalent, so the policy
# scope is the one place that decides this for all of them.
#
# A leak here is a trust bug rather than a cosmetic one: a document the user believes
# they deleted keeps turning up, and clicking it 404s.
RSpec.describe "trashed records are not visible through policy scopes" do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents,
           "tables/tables"

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:user_context) { PolicyUserContext.new(organization_memberships(:om_is_pawel)) }

  def scope_for(model)
    Pundit.policy_scope!(user_context, model.all)
  end

  it "excludes a trashed document" do
    document = documents(:one)
    expect(scope_for(Document)).to include(document)

    document.trash!(by: user)

    expect(scope_for(Document)).not_to include(document)
  end

  it "excludes a trashed table" do
    table = tables_tables(:projects)
    expect(scope_for(Table)).to include(table)

    table.trash!(by: user)

    expect(scope_for(Table)).not_to include(table)
  end
end

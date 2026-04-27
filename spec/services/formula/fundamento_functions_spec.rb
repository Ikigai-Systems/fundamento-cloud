require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  fixtures :organizations, :users, :organization_memberships

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { nil }

  let(:engine) { Formula::Engine.new(
    additional_functions: Formula::FundamentoFunctions.new(pundit_user: PolicyUserContext.new(user, organization), space:).functions)
  }

  describe "User" do
    it "returns current user" do
      result = engine.evaluate('User()')

      expect(result).to include(first_name: user.first_name, last_name: user.last_name)
    end
  end

  describe "Organization" do
    it "returns current organization" do
      result = engine.evaluate('Organization()')

      expect(result).to include(name: organization.name)
    end
  end

  describe "Table" do
    fixtures :spaces
    fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

    let(:space) { spaces(:is_default) }

    it "returns a table" do
      result = engine.evaluate("Table(\"#{tables_tables(:projects).id}\")")

      expect(result).to be_a(Array)
      expect(result[0]).to include("Description", "Key", "Name", "Value")
    end

    context "without space" do
      let(:space) { nil }

      it "looks up a table by id across the organization" do
        result = engine.evaluate("Table(\"#{tables_tables(:projects).id}\")")

        expect(result).to be_a(Array)
        expect(result[0]).to include("Description", "Key", "Name", "Value")
      end

      it "looks up a table by name when unique in the organization" do
        result = engine.evaluate("Table(\"#{tables_tables(:projects).name}\")")

        expect(result).to be_a(Array)
      end

      it "raises AmbiguousTable when name matches multiple tables in the organization" do
        Table.create!(
          id: "duplicate_projects",
          name: tables_tables(:projects).name,
          organization: organization,
          space: spaces(:is_stefans),
          parent: spaces(:is_stefans)
        )

        expect {
          engine.evaluate("Table(\"#{tables_tables(:projects).name}\")")
        }.to raise_error(Formula::TableLookup::AmbiguousTable, /Multiple tables/)
      end
    end
  end
end
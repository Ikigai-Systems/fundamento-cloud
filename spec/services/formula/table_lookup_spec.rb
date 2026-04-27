require "rails_helper"

RSpec.describe Formula::TableLookup, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables"

  let(:organization) { organizations(:is) }
  let(:organization_membership) { organization_memberships(:om_is_pawel) }
  let(:pundit_user) { PolicyUserContext.new(organization_membership) }
  let(:default_space) { spaces(:is_default) }
  let(:other_space) { spaces(:is_stefans) }
  let(:projects_table) { tables_tables(:projects) }

  describe "#find!" do
    context "when space is provided" do
      let(:lookup) { described_class.new(space: default_space, pundit_user: pundit_user) }

      it "finds a table by id" do
        expect(lookup.find!(projects_table.id)).to eq(projects_table)
      end

      it "finds a table by name" do
        expect(lookup.find!(projects_table.name)).to eq(projects_table)
      end

      it "raises RecordNotFound for unknown table" do
        expect { lookup.find!("unknown") }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "does not find a table from a different space" do
        other_table = Table.create!(
          id: "other_space_projects",
          name: "Projects",
          organization: organization,
          space: other_space,
          parent: other_space
        )

        # Same name as projects_table but in other_space — should still find the one in default_space
        result = lookup.find!("Projects")
        expect(result).to eq(projects_table)
        expect(result).not_to eq(other_table)
      end
    end

    context "when space is nil" do
      let(:lookup) { described_class.new(space: nil, pundit_user: pundit_user) }

      it "finds a table by id (NPI is globally unique)" do
        expect(lookup.find!(projects_table.id)).to eq(projects_table)
      end

      it "finds a table by name when unique in the organization" do
        expect(lookup.find!(projects_table.name)).to eq(projects_table)
      end

      it "raises RecordNotFound for unknown table" do
        expect { lookup.find!("unknown") }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "raises AmbiguousTable when multiple tables share the name across spaces" do
        Table.create!(
          id: "duplicate_projects",
          name: projects_table.name,
          organization: organization,
          space: other_space,
          parent: other_space
        )

        expect { lookup.find!(projects_table.name) }.to raise_error(
          Formula::TableLookup::AmbiguousTable, /Multiple tables/
        )
      end

      it "still finds by id even when name would be ambiguous" do
        Table.create!(
          id: "duplicate_projects",
          name: projects_table.name,
          organization: organization,
          space: other_space,
          parent: other_space
        )

        expect(lookup.find!(projects_table.id)).to eq(projects_table)
      end
    end

    context "authorization" do
      let(:lookup) { described_class.new(space: nil, pundit_user: pundit_user) }

      it "raises NotAuthorizedError when the user cannot show the table" do
        allow(Pundit).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)

        expect { lookup.find!(projects_table.id) }.to raise_error(Pundit::NotAuthorizedError)
      end
    end
  end
end

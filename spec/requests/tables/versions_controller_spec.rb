require "rails_helper"

RSpec.describe Tables::VersionsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:table) { tables_tables(:projects) }

  before do
    sign_in pawel
    post select_organization_path(ikigai_systems)
  end

  when_feature_disabled(:table_versioning) do
    it "hides the history entirely" do
      get table_versions_path(table)

      expect(response).to have_http_status(:not_found)
    end
  end

  when_feature_enabled(:table_versioning) do
    let!(:baseline) { Tables::VersionSnapshotService.new(table, kind: :initial).call }

    describe "GET index" do
      it "lists the versions with what changed in each" do
        Current.set(user: pawel, change_source: "ui") { tables_cells(:projects_jira_key).update!(value: "CHANGED") }
        Tables::VersionSnapshotService.new(table).call

        get table_versions_path(table)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Table history")
        expect(response.body).to include("1 cell")
        expect(response.body).to include("Baseline")
      end

      it "says so when there is no history yet" do
        table.versions.destroy_all

        get table_versions_path(table)

        expect(response.body).to include("No history yet")
      end
    end

    describe "GET show" do
      it "renders the version by its sequential id" do
        get table_version_path(table, baseline)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Historical versions")
        expect(response.body).to include("Restore this version")
      end

      it "resolves 'latest' to the newest version" do
        get table_version_path(table, "latest")

        expect(response).to have_http_status(:ok)
      end

      it "404s on a version that does not exist" do
        get table_version_path(table, 999)

        expect(response).to have_http_status(:not_found)
      end

      # Rendering means parsing the whole snapshot, which a table near the size ceiling
      # cannot survive in a request. Restore stays available.
      it "declines to preview a version too large to render, but still offers restore" do
        baseline.update!(row_count: 100_000, column_count: 200)

        get table_version_path(table, baseline)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("too large to preview")
        expect(response.body).to include("Restore this version")
      end

      it "warns that formula columns hold no stored values" do
        table.columns.create!(organization: table.organization, previous_column: table.columns_in_order.last, name: "Total", kind: :formula, formula: "=1+1")
        version = Tables::VersionSnapshotService.new(table).call

        get table_version_path(table, version)

        expect(response.body).to include("Formula columns show no values in history")
      end
    end

    describe "POST restore" do
      it "puts the table back and records the restore" do
        Current.set(user: pawel, change_source: "ui") { tables_cells(:projects_jira_key).update!(value: "CHANGED") }

        post restore_table_version_path(table, baseline)

        expect(response).to redirect_to(table_path(table))
        # Cells are recreated, so they get new ids; the row and column NPIs are what
        # is preserved, and the value is read back through them.
        expect(table.reload.data_to_json[:rows].first.values).to include("JIRA")
        expect(table.versions.where(kind: :restore).count).to eq 1
      end
    end

    describe "authorization" do
      # The selected organization scopes the lookup, so a table belonging to another one
      # is not merely forbidden, it is invisible.
      let(:other_organization_table) do
        Table.create!(
          name: "HC Table",
          organization: organizations(:hc),
          space: spaces(:hc_default),
          parent: spaces(:hc_default),
        )
      end

      it "refuses a table from another organization" do
        get table_versions_path(other_organization_table)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

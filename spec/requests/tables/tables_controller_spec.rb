require "rails_helper"

RSpec.describe Tables::TablesController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces,
           "tables/tables", "tables/columns", "tables/rows"

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:table) { tables_tables(:projects) }

  describe "GET /t.json?mention=true" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
    end

    it "returns color for a colored table" do
      table.update!(color: "blue")

      get tables_path(format: :json, mention: true)

      rows = JSON.parse(response.body).index_by { _1["id"] }
      expect(rows[table.id]["color"]).to eq("blue")
    end
  end

  describe "PATCH /t/:id" do
    let(:all_names) { HasColor::NAMES.join(", ") }

    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
    end

    def patch_color(table, color)
      patch table_path(table, format: :json), params: { table: { color: color } }, as: :json
    end

    it "sets the color and returns its name" do
      patch_color(table, "Indigo")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["color"]).to eq("indigo")
      expect(table.reload.color).to eq("indigo")
    end

    it "clears the color with an empty string" do
      table.update!(color: "blue")

      patch_color(table, "")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["color"]).to be_nil
      expect(table.reload.color).to be_nil
    end

    it "leaves the color unchanged when omitted" do
      table.update!(color: "blue")

      patch table_path(table, format: :json), params: { table: { name: "Renamed Projects" } }

      expect(response.parsed_body["color"]).to eq("blue")
      expect(table.reload.color).to eq("blue")
    end

    it "rejects an unknown color with 422 and a message naming the eight colors" do
      table.update!(color: "blue")

      patch_color(table, "chartreuse")

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
      expect(table.reload.color).to eq("blue")
    end

    it "rejects a color that isn't a string with 422" do
      [5, true].each do |value|
        patch_color(table, value)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
      end
      expect(table.reload.color).to be_nil
    end

    it "rejects a user without edit permission and leaves the color alone" do
      sign_in users(:stefan)
      post select_organization_path(ikigai_systems)
      private_space = ikigai_systems.spaces.create!(name: "Locked Room", access_mode: :private)
      locked = private_space.tables.create!(organization: ikigai_systems, name: "Secret", color: "blue")

      patch_color(locked, "crimson")

      expect(response).to have_http_status(:forbidden)
      expect(locked.reload.color).to eq("blue")
    end

    it "always includes color in the table JSON" do
      get table_path(table, format: :json)

      expect(response.parsed_body["table"]).to have_key("color")
    end
  end

  describe "DELETE /t/:id" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
    end

    it "trashes the table instead of destroying it" do
      expect {
        delete table_path(table)
      }.not_to change(Table, :count)

      expect(table.reload).to be_trashed
      expect(table.deleted_by_id).to eq(pawel.id)
    end

    it "keeps the table's rows and columns" do
      column_ids = table.columns.pluck(:id)
      expect(column_ids).not_to be_empty

      delete table_path(table)

      expect(Tables::Column.where(id: column_ids).count).to eq(column_ids.size)
    end

    # Name uniqueness is enforced by a unique index as well as a validation. Unless both
    # are scoped to kept tables, the trash holds the old name hostage for the whole
    # retention window -- which would make a recoverable delete feel worse than the
    # irreversible one it replaced.
    it "frees the table's name for reuse in the same space" do
      original_name = table.name

      delete table_path(table)

      replacement = Table.new(
        name: original_name,
        space: table.space,
        organization: table.organization,
      )
      expect(replacement.save).to be(true), replacement.errors.full_messages.to_sentence
    end
  end

  describe "GET /t/:id with Turbo-Frame: content header" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "renders the content_frame layout (contains frame tag, no left sidebar)" do
        get table_path(table),
          headers: { "Turbo-Frame" => "content" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="content"')
        expect(response.body).not_to include('id="space-sidebar"')
      end

      it "includes the content_sidebar frame for the table" do
        get table_path(table),
          headers: { "Turbo-Frame" => "content" }

        expect(response.body).to include('id="content_sidebar"')
      end

      it "renders edit in content_frame layout" do
        get edit_table_path(table),
          headers: { "Turbo-Frame" => "content" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="content"')
      end
    end
  end

  describe "GET /t/:id without Turbo-Frame: content header" do
    context "when authenticated" do
      before do
        sign_in pawel
        post select_organization_path(ikigai_systems)
      end

      it "renders full layout including left sidebar on direct access" do
        get table_path(table)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include('id="space-sidebar"')
      end
    end
  end

  describe "the History menu item" do
    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)
    end

    # link_to_with_disable renders a bare span when disabled, which is not clickable.
    # A table with no versions should still be able to reach the page that explains why.
    it "is a real link even when the table has no versions yet" do
      expect(table.versions).to be_empty

      get table_path(table)

      # A link, not the <span> link_to_with_disable renders for a disabled entry.
      expect(response.body).to include(%(href="#{table_version_path(table, "latest")}">History</a>))
    end
  end

  describe "POST /t/:id/preview_formula" do
    fixtures "tables/cells"

    let(:row) { table.rows_in_order.first }

    def add_column(name, kind, previous:, **attributes)
      table.columns.create!(name:, kind:, previous_column: previous, organization_id: table.organization_id, **attributes)
    end

    def preview(formula, col_id: nil)
      post preview_formula_table_path(table, format: :json), params: { formula:, row_id: row.id, col_id: }, as: :json
      response.parsed_body
    end

    before do
      sign_in pawel
      post select_organization_path(ikigai_systems)

      start = add_column("Start", :date, previous: tables_columns(:project_value), configuration: { "dateStoredFormat" => 2 })
      length = add_column("Length", :duration, previous: start)
      table.cells.create!(column: start, row:, value: "31.01.2024", organization_id: table.organization_id)
      table.cells.create!(column: length, row:, value: "2d", organization_id: table.organization_id)
      @finish = add_column("End", :formula, previous: length, configuration: { "dateStoredFormat" => 2 })
    end

    it "reads date and duration columns as dates and durations" do
      expect(preview('CurrentRow("Start") + CurrentRow("Length")', col_id: @finish.id)["result"]).to eq("02.02.2024")
      expect(preview('CurrentRow("Start") - Date(2024, 1, 1)')["result"]).to eq("30 days")
    end

    it "reads the result of a formula column, even one that comes later" do
      add_column("Later", :formula, previous: @finish, formula: "CurrentRow(\"Start\") + Days(1)", configuration: { "dateStoredFormat" => 2 })
      @finish.update!(formula: "CurrentRow(\"Later\") + Days(1)")

      expect(preview('CurrentRow("End") - CurrentRow("Start")')["result"]).to eq("2 days")
    end

    it "lets a formula read a column by its id, as a formula column can" do
      start = table.columns.find_by!(name: "Start")

      expect(preview("CurrentRow(\"#{start.id}\") + Days(1)")["result"]).to eq("2024-02-01")
    end

    it "shows a date in ISO when no column is given" do
      expect(preview('CurrentRow("Start") + Days(1)')["result"]).to eq("2024-02-01")
    end

    it "leaves other results as they were" do
      expect(preview('Concatenate("a", "b")')["result"]).to eq("ab")
    end

    it "reports an error without a result" do
      body = preview('CurrentRow("Start") + CurrentRow("Start")')

      expect(body["error"]).to match(/Cannot add/)
      expect(body).not_to have_key("result")
    end
  end
end

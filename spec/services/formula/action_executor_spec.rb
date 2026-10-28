require 'rails_helper'

RSpec.describe Formula::ActionExecutor, type: :service do
  fixtures :users
  fixtures :organizations
  fixtures :organization_memberships
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"
  fixtures "tables/rows"
  fixtures "tables/cells"

  let(:space) { spaces(:is_default) }
  let(:organization_membership) { organization_memberships(:om_is_pawel) }
  let(:table) { tables_tables(:projects) }

  describe 'with dry_mode: false' do
    describe 'AddRow action' do
      it 'adds a new row to the table' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        
        expect {
          action_executor.add_row({}, table.id, {
            "Key" => "NEW",
            "Name" => "New Project",
            "Description" => "A new project",
            "Value" => "100"
          })
        }.to change { table.reload.rows.count }.by(1)

        new_row = table.rows_in_order.last
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("NEW")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("New Project")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Description")).value).to eq("A new project")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Value")).value).to eq("100")
      end

      it 'adds a row using table name instead of npi' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)

        expect {
          action_executor.add_row({}, table.name, {
            "Key" => "BY_NAME",
            "Name" => "Added by name"
          })
        }.to change { table.reload.rows.count }.by(1)

        new_row = table.rows_in_order.last
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("BY_NAME")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("Added by name")
      end
    end

    describe 'DeleteRows action' do
      it 'deletes all rows from the table' do
        original_count = table.rows.count
        expect(original_count).to be > 0

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.delete_rows({}, table.id)

        expect(table.reload.rows.count).to eq(0)
      end
    end

    describe 'UpdateRows action' do
      it 'updates rows without condition (all rows)' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.update_rows({}, table.id, nil, {
          "Description" => "Updated description"
        })

        table.reload.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq("Updated description")
        end
      end

      it 'updates rows with condition formula' do
        # Update only the row where Key equals "JIRA"
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.update_rows({}, table.id, 'Equals(CurrentRow("Key"), "JIRA")', {
          "Description" => "Updated JIRA description"
        })

        table.reload
        jira_row = table.rows.find { |row|
          row.cells.find_by(column: table.columns.find_by(name: "Key")).value == "JIRA"
        }
        other_rows = table.rows.reject { |row|
          row.cells.find_by(column: table.columns.find_by(name: "Key")).value == "JIRA"
        }

        # JIRA row should be updated
        expect(jira_row.cells.find_by(column: table.columns.find_by(name: "Description")).value).to eq("Updated JIRA description")

        # Other rows should remain unchanged
        other_rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).not_to eq("Updated JIRA description")
        end
      end

      it 'does not update rows when condition returns false for all' do
        original_values = {}
        table.rows.each do |row|
          original_values[row.id] = row.cells.find_by(column: table.columns.find_by(name: "Description")).value
        end

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.update_rows({}, table.id, 'Equals(CurrentRow("Key"), "NONEXISTENT")', {
          "Description" => "Should not be updated"
        })

        table.reload.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq(original_values[row.id])
        end
      end
    end

    describe 'AddOrUpdateRows action' do
      it 'adds new row when no rows match condition' do
        original_count = table.rows.count

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.add_or_update_rows({}, table.id, 'Equals(CurrentRow("Key"), "NONEXISTENT")', {
          "Key" => "ADDED",
          "Name" => "Added Row"
        })

        expect(table.reload.rows.count).to eq(original_count + 1)
        new_row = table.rows_in_order.last
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("ADDED")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("Added Row")
      end

      it 'updates existing rows when condition matches' do
        original_count = table.rows.count

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.add_or_update_rows({}, table.id, 'Equals(CurrentRow("Key"), "JIRA")', {
          "Description" => "Updated via AddOrUpdate"
        })

        # No new rows should be added
        expect(table.reload.rows.count).to eq(original_count)

        # JIRA row should be updated
        jira_row = table.rows.find { |row|
          row.cells.find_by(column: table.columns.find_by(name: "Key")).value == "JIRA"
        }
        expect(jira_row.cells.find_by(column: table.columns.find_by(name: "Description")).value).to eq("Updated via AddOrUpdate")
      end

      it 'adds new row when no condition is provided and table is empty' do
        # First delete all rows
        Tables::DeleteRowsService.new(table).call

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.add_or_update_rows({}, table.id, nil, {
          "Key" => "FIRST",
          "Name" => "First Row"
        })

        expect(table.reload.rows.count).to eq(1)
        new_row = table.rows_in_order.first
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("FIRST")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("First Row")
      end

      it 'updates all existing rows when no condition is provided and table has data' do
        original_count = table.rows.count
        expect(original_count).to be > 0

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        action_executor.add_or_update_rows({}, table.id, nil, {
          "Description" => "Updated all via AddOrUpdate"
        })

        # No new rows should be added
        expect(table.reload.rows.count).to eq(original_count)

        # All rows should be updated
        table.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq("Updated all via AddOrUpdate")
        end
      end
    end

    describe 'multiple actions' do
      it 'executes multiple actions in sequence' do
        original_count = table.rows.count
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)
        
        action_executor.add_row({}, table.id, {
          "Key" => "FIRST",
          "Name" => "First Added",
          "Description" => "First description",
          "Value" => "10"
        })
        
        action_executor.add_row({}, table.id, {
          "Key" => "SECOND",
          "Name" => "Second Added",
          "Description" => "Second description",
          "Value" => "20"
        })
        
        action_executor.update_rows({}, table.id, 'Equals(CurrentRow("Key"), "FIRST")', {
          "Description" => "Updated first row"
        })

        expect(table.reload.rows.count).to eq(original_count + 2)

        first_row = table.rows.find { |row|
          row.cells.find_by(column: table.columns.find_by(name: "Key")).value == "FIRST"
        }
        expect(first_row.cells.find_by(column: table.columns.find_by(name: "Description")).value).to eq("Updated first row")

        second_row = table.rows.find { |row|
          row.cells.find_by(column: table.columns.find_by(name: "Key")).value == "SECOND"
        }
        expect(second_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("Second Added")
      end
    end

    describe 'error handling' do
      it 'raises error for nonexistent table' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)

        expect {
          action_executor.add_row({}, "nonexistent", { "Key" => "TEST" })
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it 'raises error for invalid formula evaluation' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership)

        expect {
          action_executor.update_rows({}, table.id, 'InvalidFormula(', {
            "Description" => "Should not update"
          })
        }.to raise_error(RuntimeError)
      end
    end

    describe 'with additional context' do
      it 'passes additional context to formula evaluation' do
        additional_context = {
          "CustomVariable" => "test_value"
        }

        action_executor = described_class.new(dry_mode: false, space: space, organization_membership: organization_membership, additional_context: additional_context)
        action_executor.update_rows(additional_context, table.id, 'Equals([CustomVariable], "test_value")', {
          "Description" => "Updated with context"
        })

        # All rows should be updated since the condition uses additional context
        table.reload.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq("Updated with context")
        end
      end
    end
  end

  describe "UpdateDocument and UpdateTable actions" do
    let(:organization) { organizations(:is) }
    let(:document) { Document.create!(title: "Plan", organization: organization, space: space) }
    let(:executor) { described_class.new(dry_mode: false, space: space, organization_membership: organization_membership) }
    let(:engine) { Formula::Engine.new }
    let(:colors_message) { "Color must be one of: #{HasColor::NAMES.join(", ")}" }

    describe "UpdateDocument" do
      it "updates title, icon and color of a document" do
        executor.update_document({}, document.id, {"title" => "Roadmap", "icon" => "🔥", "color" => "Indigo"})

        document.reload
        expect(document.title).to eq("Roadmap")
        expect(document.icon.value).to eq("🔥")
        expect(document.color).to eq("indigo")
      end

      it "accepts symbol keys" do
        executor.update_document({}, document.id, {title: "Symbols", color: "teal"})

        expect(document.reload).to have_attributes(title: "Symbols", color: "teal")
      end

      it "an empty color string clears the color and an empty icon clears the icon" do
        document.assign_title_and_icon(icon: "🔥")
        document.assign_color("blue")
        document.save!

        executor.update_document({}, document.id, {"color" => "", "icon" => ""})

        document.reload
        expect(document.color).to be_nil
        expect(document.icon).to be_nil
        expect(document.title).to eq("Plan")
      end

      it "omitted keys leave fields unchanged" do
        document.assign_title_and_icon(icon: "🔥")
        document.assign_color("blue")
        document.save!

        executor.update_document({}, document.id, {"title" => "Renamed"})

        document.reload
        expect(document.title).to eq("Renamed")
        expect(document.color).to eq("blue")
        expect(document.icon.value).to eq("🔥")
      end

      it "an unknown color is an error and leaves the record unchanged" do
        expect {
          executor.update_document({}, document.id, {"title" => "Changed", "color" => "chartreuse"})
        }.to raise_error(RuntimeError, colors_message)

        expect(document.reload).to have_attributes(title: "Plan", color: nil)
      end

      it "a non-string color (number, true) is an error" do
        [1, true].each do |value|
          expect {
            executor.update_document({}, document.id, {"color" => value})
          }.to raise_error(RuntimeError, colors_message)
        end

        expect(document.reload.color).to be_nil
      end

      it "an odd number of arguments is a clear error" do
        expect {
          engine.evaluate(%(UpdateDocument("#{document.id}", "color")), context: {}, action_executor: executor)
        }.to raise_error(RuntimeError, /UpdateDocument needs key and value pairs/)
      end

      ["", "   "].each do |blank|
        it "a blank title (#{blank.inspect}) is an error and leaves the record unchanged" do
          expect {
            engine.evaluate(%(UpdateDocument("#{document.id}", "title", "#{blank}")), context: {}, action_executor: executor)
          }.to raise_error(Formula::ActionExecutor::FormulaEvaluationError, "UpdateDocument: title can't be blank")

          expect(document.reload.title).to eq("Plan")
        end
      end

      it "a non-string title or icon is an error naming the key and leaves the record unchanged" do
        {"title" => 5, "icon" => 1}.each do |key, value|
          expect {
            engine.evaluate(%(UpdateDocument("#{document.id}", "#{key}", #{value})), context: {}, action_executor: executor)
          }.to raise_error(Formula::ActionExecutor::FormulaEvaluationError, "UpdateDocument: #{key} must be text")
        end

        expect(document.reload.title).to eq("Plan")
        expect(document.icon).to be_nil
      end

      it "a non-emoji icon is an error and leaves the record unchanged" do
        expect {
          executor.update_document({}, document.id, {"title" => "Changed", "icon" => "abc"})
        }.to raise_error(RuntimeError, "Icon must be a single emoji")

        expect(document.reload.title).to eq("Plan")
      end

      it "an unknown key is an error that names the valid keys" do
        expect {
          executor.update_document({}, document.id, {"colour" => "blue"})
        }.to raise_error(RuntimeError, "UpdateDocument accepts title, icon and color (got colour)")
      end

      it "no keys is an error" do
        expect {
          executor.update_document({}, document.id, {})
        }.to raise_error(RuntimeError, /UpdateDocument needs at least one of title, icon and color/)
      end

      it "a user without update permission cannot change it (error, record unchanged)" do
        archived = Document.create!(title: "Frozen", organization: organization, space: spaces(:is_archived))
        member = described_class.new(dry_mode: false, space: nil, organization_membership: organization_memberships(:om_is_stefan))

        expect {
          member.update_document({}, archived.id, {"title" => "Hacked"})
        }.to raise_error(Pundit::NotAuthorizedError)

        expect(archived.reload.title).to eq("Frozen")
      end

      it "a role-limited member who can see but not edit the document is denied (record unchanged)" do
        restricted = Document.create!(title: "Locked", organization: organizations(:hc), space: spaces(:hc_restricted))
        member = described_class.new(dry_mode: false, space: nil, organization_membership: organization_memberships(:om_hc_stefan))

        expect(Pundit.policy!(PolicyUserContext.new(organization_memberships(:om_hc_stefan)), restricted).show?).to be(true)
        expect {
          member.update_document({}, restricted.id, {"title" => "Hacked"})
        }.to raise_error(Pundit::NotAuthorizedError)

        expect(restricted.reload.title).to eq("Locked")
      end

      it "a document in a space the user cannot see is denied, even in dry mode" do
        hidden = Document.create!(title: "Hidden", organization: organizations(:hc), space: spaces(:hc_pawels))

        [true, false].each do |dry|
          member = described_class.new(dry_mode: dry, space: nil, organization_membership: organization_memberships(:om_hc_stefan))
          expect {
            member.update_document({}, hidden.id, {"title" => "Hacked"})
          }.to raise_error(Pundit::NotAuthorizedError)
          expect(member.get_actions).to be_empty
        end

        expect(hidden.reload.title).to eq("Hidden")
      end

      it "cannot update a document in another space of the same organization" do
        elsewhere = Document.create!(title: "Elsewhere", organization: organization, space: spaces(:is_stefans))

        expect {
          executor.update_document({}, elsewhere.id, {"title" => "Mine"})
        }.to raise_error(ActiveRecord::RecordNotFound)

        expect(elsewhere.reload.title).to eq("Elsewhere")
      end

      it "a document from another organization cannot be updated" do
        other = Document.create!(title: "Theirs", organization: organizations(:hc), space: spaces(:hc_default))

        expect {
          executor.update_document({}, other.id, {"title" => "Mine"})
        }.to raise_error(ActiveRecord::RecordNotFound)

        expect(other.reload.title).to eq("Theirs")
      end

      it "works through the formula language" do
        result = engine.evaluate(%(UpdateDocument("#{document.id}", "color", "indigo", "title", "Via formula")), context: {}, action_executor: executor)

        expect(result).to eq(true)
        expect(document.reload).to have_attributes(title: "Via formula", color: "indigo")
      end

      it "reports an unknown color from the formula language as an error" do

        expect {
          engine.evaluate(%(UpdateDocument("#{document.id}", "color", "chartreuse")), context: {}, action_executor: executor)
        }.to raise_error(RuntimeError, /Color must be one of/)

        expect(document.reload.color).to be_nil
      end
    end

    describe "UpdateTable" do
      let!(:new_table) { Table.create!(name: "Backlog", organization: organization, space: space) }

      it "updates name, icon and color of a table" do
        executor.update_table({}, new_table.id, {"name" => "Sprint", "icon" => "🚀", "color" => "lime"})

        new_table.reload
        expect(new_table.name).to eq("Sprint")
        expect(new_table.icon.value).to eq("🚀")
        expect(new_table.color).to eq("lime")
      end

      it "finds the table by name too" do
        executor.update_table({}, "Backlog", {"color" => "slate"})

        expect(new_table.reload.color).to eq("slate")
      end

      it "an odd number of arguments is a clear error" do
        expect {
          engine.evaluate(%(UpdateTable("projects", "color")), context: {}, action_executor: executor)
        }.to raise_error(RuntimeError, /UpdateTable needs key and value pairs/)
      end

      ["", "   "].each do |blank|
        it "a blank name (#{blank.inspect}) is an error and leaves the record unchanged" do
          expect {
            engine.evaluate(%(UpdateTable("#{new_table.id}", "name", "#{blank}")), context: {}, action_executor: executor)
          }.to raise_error(Formula::ActionExecutor::FormulaEvaluationError, "UpdateTable: name can't be blank")

          expect(new_table.reload.name).to eq("Backlog")
        end
      end

      it "a non-string name or icon is an error naming the key and leaves the record unchanged" do
        {"name" => "7", "icon" => "1"}.each do |key, value|
          expect {
            engine.evaluate(%(UpdateTable("#{new_table.id}", "#{key}", #{value})), context: {}, action_executor: executor)
          }.to raise_error(Formula::ActionExecutor::FormulaEvaluationError, "UpdateTable: #{key} must be text")
        end

        expect(new_table.reload.name).to eq("Backlog")
        expect(new_table.icon).to be_nil
      end

      it "an unknown key (including title) is an error that names the valid keys" do
        expect {
          executor.update_table({}, new_table.id, {"title" => "Nope"})
        }.to raise_error(RuntimeError, "UpdateTable accepts name, icon and color (got title)")
      end

      it "no keys is an error" do
        expect {
          executor.update_table({}, new_table.id, {})
        }.to raise_error(RuntimeError, /UpdateTable needs at least one of name, icon and color/)
      end

      it "a validation error such as a duplicate name surfaces as a formula error" do
        expect {
          executor.update_table({}, new_table.id, {"name" => table.name})
        }.to raise_error(Formula::ActionExecutor::FormulaEvaluationError)

        expect(new_table.reload.name).to eq("Backlog")
      end

      it "a user without update permission cannot change it (error, record unchanged)" do
        archived = Table.create!(name: "Frozen", organization: organization, space: spaces(:is_archived))
        member = described_class.new(dry_mode: false, space: nil, organization_membership: organization_memberships(:om_is_stefan))

        expect {
          member.update_table({}, archived.id, {"name" => "Hacked"})
        }.to raise_error(Pundit::NotAuthorizedError)

        expect(archived.reload.name).to eq("Frozen")
      end

      it "a role-limited member who can see but not edit the table is denied (record unchanged)" do
        restricted = Table.create!(name: "Locked", organization: organizations(:hc), space: spaces(:hc_restricted))
        member = described_class.new(dry_mode: false, space: nil, organization_membership: organization_memberships(:om_hc_stefan))

        expect {
          member.update_table({}, restricted.id, {"name" => "Hacked"})
        }.to raise_error(Pundit::NotAuthorizedError)

        expect(restricted.reload.name).to eq("Locked")
      end

      it "a table in another space the executor does not allow is rejected as the other actions do" do
        elsewhere = Table.create!(name: "Elsewhere", organization: organization, space: spaces(:is_stefans))

        expect {
          executor.update_table({}, elsewhere.id, {"color" => "blue"})
        }.to raise_error(ActiveRecord::RecordNotFound)

        expect(elsewhere.reload.color).to be_nil
      end

      it "works through the formula language" do
        result = engine.evaluate(%(UpdateTable("#{new_table.id}", "color", "teal", "name", "Via formula")), context: {}, action_executor: executor)

        expect(result).to eq(true)
        expect(new_table.reload).to have_attributes(name: "Via formula", color: "teal")
      end
    end
  end
end

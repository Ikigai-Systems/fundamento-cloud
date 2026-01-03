require 'rails_helper'

RSpec.describe Formula::ActionExecutor, type: :service do
  fixtures :users
  fixtures :organizations
  fixtures :organization_users
  fixtures :spaces
  fixtures "tables/tables"
  fixtures "tables/columns"
  fixtures "tables/rows"
  fixtures "tables/cells"

  let(:space) { spaces(:is_default) }
  let(:organization_user) { organization_users(:ou_is_pawel) }
  let(:table) { tables_tables(:projects) }

  describe 'with dry_mode: false' do
    describe 'AddRow action' do
      it 'adds a new row to the table' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
        
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
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)

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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
        action_executor.delete_rows({}, table.id)

        expect(table.reload.rows.count).to eq(0)
      end
    end

    describe 'UpdateRows action' do
      it 'updates rows without condition (all rows)' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
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
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)
        
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
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)

        expect {
          action_executor.add_row({}, "nonexistent", { "Key" => "TEST" })
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it 'raises error for invalid formula evaluation' do
        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user)

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

        action_executor = described_class.new(dry_mode: false, space: space, organization_user: organization_user, additional_context: additional_context)
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
end
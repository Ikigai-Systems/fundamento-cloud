require 'rails_helper'

RSpec.describe Formula::ExecuteActionsService, type: :service do
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

  describe '#call' do
    describe 'AddRow action' do
      it 'adds a new row to the table' do
        actions = [
          {
            type: "AddRow",
            tableNpi: table.npi,
            values: {
              "Key" => "NEW",
              "Name" => "New Project",
              "Description" => "A new project",
              "Value" => "100"
            }
          }
        ]

        expect {
          described_class.new(actions, space, organization_user).call
        }.to change { table.reload.rows.count }.by(1)

        new_row = table.rows.last
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("NEW")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("New Project")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Description")).value).to eq("A new project")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Value")).value).to eq("100")
      end

      it 'adds a row using table name instead of npi' do
        actions = [
          {
            type: "AddRow",
            tableNpi: table.name,
            values: {
              "Key" => "BY_NAME",
              "Name" => "Added by name"
            }
          }
        ]

        expect {
          described_class.new(actions, space, organization_user).call
        }.to change { table.reload.rows.count }.by(1)

        new_row = table.rows.last
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("BY_NAME")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("Added by name")
      end
    end

    describe 'DeleteRows action' do
      it 'deletes all rows from the table' do
        original_count = table.rows.count
        expect(original_count).to be > 0

        actions = [
          {
            type: "DeleteRows",
            tableNpi: table.npi
          }
        ]

        described_class.new(actions, space, organization_user).call

        expect(table.reload.rows.count).to eq(0)
      end
    end

    describe 'UpdateRows action' do
      it 'updates rows without condition (all rows)' do
        actions = [
          {
            type: "UpdateRows",
            tableNpi: table.npi,
            conditionFormula: nil,
            values: {
              "Description" => "Updated description"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

        table.reload.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq("Updated description")
        end
      end

      it 'updates rows with condition formula' do
        # Update only the row where Key equals "JIRA"
        actions = [
          {
            type: "UpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'Equals(CurrentRow("Key"), "JIRA")',
            values: {
              "Description" => "Updated JIRA description"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

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

        actions = [
          {
            type: "UpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'Equals(CurrentRow("Key"), "NONEXISTENT")',
            values: {
              "Description" => "Should not be updated"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

        table.reload.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq(original_values[row.id])
        end
      end
    end

    describe 'AddOrUpdateRows action' do
      it 'adds new row when no rows match condition' do
        original_count = table.rows.count

        actions = [
          {
            type: "AddOrUpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'Equals(CurrentRow("Key"), "NONEXISTENT")',
            values: {
              "Key" => "ADDED",
              "Name" => "Added Row"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

        expect(table.reload.rows.count).to eq(original_count + 1)
        new_row = table.rows.last
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("ADDED")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("Added Row")
      end

      it 'updates existing rows when condition matches' do
        original_count = table.rows.count

        actions = [
          {
            type: "AddOrUpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'Equals(CurrentRow("Key"), "JIRA")',
            values: {
              "Description" => "Updated via AddOrUpdate"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

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

        actions = [
          {
            type: "AddOrUpdateRows",
            tableNpi: table.npi,
            conditionFormula: nil,
            values: {
              "Key" => "FIRST",
              "Name" => "First Row"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

        expect(table.reload.rows.count).to eq(1)
        new_row = table.rows.first
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Key")).value).to eq("FIRST")
        expect(new_row.cells.find_by(column: table.columns.find_by(name: "Name")).value).to eq("First Row")
      end

      it 'updates all existing rows when no condition is provided and table has data' do
        original_count = table.rows.count
        expect(original_count).to be > 0

        actions = [
          {
            type: "AddOrUpdateRows",
            tableNpi: table.npi,
            conditionFormula: nil,
            values: {
              "Description" => "Updated all via AddOrUpdate"
            }
          }
        ]

        described_class.new(actions, space, organization_user).call

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
        actions = [
          {
            type: "AddRow",
            tableNpi: table.npi,
            values: {
              "Key" => "FIRST",
              "Name" => "First Added",
              "Description" => "First description",
              "Value" => "10"
            }
          },
          {
            type: "AddRow",
            tableNpi: table.npi,
            values: {
              "Key" => "SECOND",
              "Name" => "Second Added",
              "Description" => "Second description",
              "Value" => "20"
            }
          },
          {
            type: "UpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'Equals(CurrentRow("Key"), "FIRST")',
            values: {
              "Description" => "Updated first row"
            }
          }
        ]

        original_count = table.rows.count
        described_class.new(actions, space, organization_user).call

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
      it 'logs warning for unrecognized action type' do
        actions = [
          {
            type: "UnknownAction",
            tableNpi: table.npi
          }
        ]

        expect(Rails.logger).to receive(:warn).with(/unrecognized action type/)

        described_class.new(actions, space, organization_user).call
      end

      it 'raises error for nonexistent table' do
        actions = [
          {
            type: "AddRow",
            tableNpi: "nonexistent",
            values: { "Key" => "TEST" }
          }
        ]

        expect {
          described_class.new(actions, space, organization_user).call
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it 'handles formula evaluation errors gracefully' do
        actions = [
          {
            type: "UpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'InvalidFormula(',
            values: {
              "Description" => "Should not update"
            }
          }
        ]

        expect(Rails.logger).to receive(:error).at_least(:once).with(/Failed to evaluate condition formula/)

        # Should not raise an error, just log it
        expect {
          described_class.new(actions, space, organization_user).call
        }.not_to raise_error
      end
    end

    describe 'with additional context' do
      it 'passes additional context to formula evaluation' do
        additional_context = {
          "CustomVariable" => "test_value"
        }

        actions = [
          {
            type: "UpdateRows",
            tableNpi: table.npi,
            conditionFormula: 'Equals([CustomVariable], "test_value")',
            values: {
              "Description" => "Updated with context"
            }
          }
        ]

        described_class.new(actions, space, organization_user, additional_context).call

        # All rows should be updated since the condition uses additional context
        table.reload.rows.each do |row|
          description_cell = row.cells.find_by(column: table.columns.find_by(name: "Description"))
          expect(description_cell.value).to eq("Updated with context")
        end
      end
    end
  end
end
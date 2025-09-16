require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  let(:engine) { Formula::Engine.new }
  let(:action_executor) { Formula::ActionExecutor.new }

  describe 'Actions' do
    describe 'RunActions' do
      it 'evaluates nested actions and collects commands' do
        context = {
          currentRow: {
            "Name" => "Jira",
            "Key" => "JIRA",
          }
        }

        formula = 'RunActions(
          DeleteRows("npi"),
          RunActions(
            AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name"))),
            AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))
          )
        )'

        result = engine.evaluate(formula, context:, action_executor:)

        expected_actions = [
          {
            tableNpi: "npi",
            type: "DeleteRows"
          },
          {
            type: "AddRow",
            tableNpi: "npi",
            values: {
              "column_npi" => "JIRA Jira"
            },
          },
          {
            type: "AddRow",
            tableNpi: "npi",
            values: {
              "column_npi" => "JIRA Jira"
            }
          }
        ]

        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq(expected_actions)
      end
    end

    describe 'AddRow' do
      it 'creates AddRow command with proper structure' do
        context = {
          currentRow: {
            "Name" => "Jira",
            "Key" => "JIRA",
          }
        }

        formula = 'AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))'
        result = engine.evaluate(formula, context:, action_executor:)

        expected_actions = [
          {
            type: "AddRow",
            tableNpi: "npi",
            values: {
              "column_npi" => "JIRA Jira"
            }
          }
        ]

        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq(expected_actions)
      end

      context 'with positional arguments' do
        it 'creates AddRow action with proper values' do
          context = {
            currentRow: {
              "Name" => "Jira",
              "Key" => "JIRA",
            }
          }

          formula = 'AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))'
          result = engine.evaluate(formula, context:, action_executor:)

          expected_actions = [
            {
              type: "AddRow",
              tableNpi: "npi",
              values: {
                "column_npi" => "JIRA Jira"
              }
            }
          ]

          expect(result).to eq(true)
          expect(action_executor.get_actions).to eq(expected_actions)
        end
      end

      context 'with ForEach iteration' do
        it 'creates multiple AddRow commands from webhook data' do
          webhook_body = JSON.parse(File.read(Rails.root.join('spec/fixtures/files/formula/metabase-webhook.json')))

          context = {
            "WebhookBody" => webhook_body
          }

          formula = 'ForEach(Dig([WebhookBody], "data", "raw_data", "rows"), AddRow("npi", "column_npi", First(CurrentValue), "another_npi", Last(CurrentValue)))'
          result = engine.evaluate(formula, context:, action_executor:)

          expect(result).to eq([true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true])
          expect(action_executor.get_actions).to eq([
            {
              type: "AddRow",
              tableNpi: "npi",
              values: { "another_npi" => 2, "column_npi" => "2024-07-07T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 2, "column_npi" => "2024-07-14T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 2, "column_npi" => "2024-07-21T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 2, "column_npi" => "2024-07-28T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-08-04T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-08-11T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-08-18T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-08-25T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-09-01T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-09-08T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-09-15T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-09-22T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-09-29T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 3, "column_npi" => "2024-10-06T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 4, "column_npi" => "2024-10-13T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 6, "column_npi" => "2024-10-20T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 7, "column_npi" => "2024-10-27T00:00:00+02:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 8, "column_npi" => "2024-11-03T00:00:00+01:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 9, "column_npi" => "2024-11-10T00:00:00+01:00" }
            },
            { tableNpi: "npi",
              type: "AddRow",
              values: { "another_npi" => 12, "column_npi" => "2024-11-17T00:00:00+01:00" }
            }
          ])
        end
      end
    end

    describe 'DeleteRows' do
      it 'creates DeleteRows command' do
        formula = 'DeleteRows("table_npi")'
        result = engine.evaluate(formula, action_executor:)

        expected_actions = [
          {
            type: "DeleteRows",
            tableNpi: "table_npi"
          }
        ]

        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq(expected_actions)
      end
    end

    describe 'UpdateRows' do
      it 'creates UpdateRows command with condition and values' do
        formula = 'UpdateRows("table_npi", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)

        expected_actions = [
          {
            type: "UpdateRows",
            tableNpi: "table_npi",
            conditionFormula: "condition_formula",
            values: {
              "col1" => "value1",
              "col2" => "value2"
            }
          }
        ]

        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq(expected_actions)
      end
    end

    describe 'AddOrUpdateRows' do
      it 'creates AddOrUpdateRows command with condition and values' do
        formula = 'AddOrUpdateRows("table_npi", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)

        expected_actions = [
          {
            type: "AddOrUpdateRows",
            tableNpi: "table_npi",
            conditionFormula: "condition_formula",
            values: {
              "col1" => "value1",
              "col2" => "value2"
            }
          }
        ]

        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq(expected_actions)
      end
    end
  end
end
require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
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
  let(:action_executor) { Formula::ActionExecutor.new(space: space, organization_membership: organization_membership) }
  let(:engine) { Formula::Engine.new }

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
          DeleteRows("projects"),
          RunActions(
            AddRow("projects", "project_description", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name"))),
            AddRow("projects", "project_description", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))
          )
        )'

        result = engine.evaluate(formula, context:, action_executor:)

        expected_actions = [
          {
            tableId: "projects",
            type: "DeleteRows"
          },
          {
            type: "AddRow",
            tableId: "projects",
            values: {
              "project_description" => "JIRA Jira"
            },
          },
          {
            type: "AddRow",
            tableId: "projects",
            values: {
              "project_description" => "JIRA Jira"
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

        formula = 'AddRow("Projects", "project_description", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))'
        result = engine.evaluate(formula, context:, action_executor:)

        expected_actions = [
          {
            type: "AddRow",
            tableId: "projects",
            values: {
              "project_description" => "JIRA Jira"
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

          formula = 'AddRow("Projects", "projects_description", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))'
          result = engine.evaluate(formula, context:, action_executor:)

          expected_actions = [
            {
              type: "AddRow",
              tableId: "projects",
              values: {
                "projects_description" => "JIRA Jira"
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

          formula = 'ForEach(Dig([WebhookBody], "data", "raw_data", "rows"), AddRow("Users Tracker", "users_tracker_counted_at", First(CurrentValue), "users_tracker_count", Last(CurrentValue)))'
          result = engine.evaluate(formula, context:, action_executor:)

          expect(result).to eq([true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true])
          expect(action_executor.get_actions).to eq([
            {
              type: "AddRow",
              tableId: "users_tracker",
              values: { "users_tracker_count" => 2, "users_tracker_counted_at" => "2024-07-07T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 2, "users_tracker_counted_at" => "2024-07-14T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 2, "users_tracker_counted_at" => "2024-07-21T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 2, "users_tracker_counted_at" => "2024-07-28T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-08-04T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-08-11T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-08-18T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-08-25T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-09-01T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-09-08T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-09-15T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-09-22T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-09-29T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 3, "users_tracker_counted_at" => "2024-10-06T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 4, "users_tracker_counted_at" => "2024-10-13T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 6, "users_tracker_counted_at" => "2024-10-20T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 7, "users_tracker_counted_at" => "2024-10-27T00:00:00+02:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 8, "users_tracker_counted_at" => "2024-11-03T00:00:00+01:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 9, "users_tracker_counted_at" => "2024-11-10T00:00:00+01:00" }
            },
            { tableId: "users_tracker",
              type: "AddRow",
              values: { "users_tracker_count" => 12, "users_tracker_counted_at" => "2024-11-17T00:00:00+01:00" }
            }
          ])
        end
      end
    end

    describe 'DeleteRows' do
      it 'creates DeleteRows command' do
        formula = 'DeleteRows("Projects")'
        result = engine.evaluate(formula, action_executor:)

        expected_actions = [
          {
            type: "DeleteRows",
            tableId: "projects"
          }
        ]

        expect(result).to eq(true)
        expect(action_executor.get_actions).to eq(expected_actions)
      end
    end

    describe 'UpdateRows' do
      it 'creates UpdateRows command with condition and values' do
        formula = 'UpdateRows("projects", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)

        expected_actions = [
          {
            type: "UpdateRows",
            tableId: "projects",
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
        formula = 'AddOrUpdateRows("projects", "condition_formula", "col1", "value1", "col2", "value2")'
        result = engine.evaluate(formula, action_executor:)

        expected_actions = [
          {
            type: "AddOrUpdateRows",
            tableId: "projects",
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
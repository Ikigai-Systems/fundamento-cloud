require "rails_helper"

RSpec.describe "Api::V1::AutomationInvocations", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:manager) { users(:pawel) }
  let(:organization) { organizations(:hc) }
  let(:space) { spaces(:hc_default) }
  let(:org_user) { organization_memberships(:om_hc_pawel) }

  let(:webhook_body) { JSON.parse(File.read(Rails.root.join("spec/fixtures/files/formula/metabase-webhook.json"))) }

  let!(:api_token) do
    ApiToken.create!(
      organization: organization,
      organization_membership: org_user,
      title: "Test API Token",
    )
  end

  let!(:table) do
    space.tables.create!(
      organization: organization,
      name: "Test Table",
      id: "npi",
      parent: space,
    )
  end

  let!(:column_npi_column) do
    table.columns.create!(
      organization: organization,
      name: "column_npi",
      id: "column_npi",
      kind: 0,
      previous_column: nil,
    )
  end

  let!(:another_npi_column) do
    table.columns.create!(
      organization: organization,
      name: "another_npi",
      id: "another_npi",
      kind: 0,
      previous_column: column_npi_column,
    )
  end

  let(:automation) do
    space.automations.create!(
      organization: organization,
      run_as: org_user,
      title: "Webhook Automation",
      kind: "webhook",
      formula: 'ForEach(Dig([WebhookBody], "data", "raw_data", "rows"), AddRow("npi", "column_npi", First(CurrentValue), "another_npi", Last(CurrentValue)))',
    )
  end

  describe "POST /api/v1/automations/:automation_npi/invocations" do
    context "with valid webhook data" do
      it "creates an invocation and enqueues the job" do
        expect {
          post api_v1_automation_invocations_path(automation.id),
            params: webhook_body.to_json,
            headers: {
              "Content-Type" => "application/json",
              "Authorization" => "Bearer #{api_token.encrypted_token}",
            }
        }.to change(AutomationInvocation, :count).by(1)

        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response["id"]).to be_present

        invocation = AutomationInvocation.last
        expect(invocation.automation).to eq(automation)
        expect(invocation.organization).to eq(organization)
        expect(invocation.space).to eq(space)
        expect(invocation.kind).to eq("webhook")
        expect(invocation.formula).to eq(automation.formula)
        expect(invocation.webhook).to eq(webhook_body.to_json)

        # Verify job was enqueued
        expect(AutomationInvocationJob).to have_been_enqueued.with(invocation)
      end
    end

  end
end

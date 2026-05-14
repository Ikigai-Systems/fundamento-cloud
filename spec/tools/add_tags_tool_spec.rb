require "rails_helper"

RSpec.describe AddTagsTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents

  let(:user) { users(:pawel) }
  let(:document) { documents(:one) }
  let(:organization) { document.organization }
  let(:space) { document.space }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "adding tags to a document" do
      it "adds new tags with # prefix and creates them if they don't exist" do
        tags_to_add = ["#biznes", "#marketing", "#biznes/strategia"]

        expect {
          response = AddTagsTool.call(
            object_id: document.id,
            object_type: "Document",
            tags: tags_to_add,
            server_context: server_context
          )

          expect(response).to be_a(MCP::Tool::Response)
          expect(response.content).to be_an(Array)
          expect(response.content.first[:type]).to eq("text")

          json_response = JSON.parse(response.content.first[:text])
          expect(json_response["tags"]).to contain_exactly("#biznes", "#marketing", "#biznes/strategia")
        }.to change(Tag, :count).by(3)
          .and change(ObjectTag, :count).by(3)

        # Verify tags were created in the correct space
        created_tags = Tag.where(name: ["biznes", "marketing", "biznes/strategia"], space: space)
        expect(created_tags.count).to eq(3)

        # Verify ObjectTag associations were created
        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("biznes", "marketing", "biznes/strategia")
      end

      it "handles tags without # prefix" do
        response = AddTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["projekt", "urgent"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#projekt", "#urgent")
      end

      it "normalizes tag names to lowercase" do
        response = AddTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#BIZNES", "#Marketing", "#BIZNES/Zarządzanie"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#biznes", "#marketing", "#biznes/zarządzanie")

        # Verify tags were stored with lowercase names
        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("biznes", "marketing", "biznes/zarządzanie")
      end

      it "doesn't create duplicate ObjectTag associations when tag already exists on object" do
        # First, add a tag
        existing_tag = Tag.create!(name: "existing", space: space, organization: organization)
        ObjectTag.create!(tag: existing_tag, object: document, organization: organization)

        expect {
          AddTagsTool.call(
            object_id: document.id,
            object_type: "Document",
            tags: ["#existing", "#new"],
            server_context: server_context
          )
        }.to change(ObjectTag, :count).by(1) # Only the new tag should create an ObjectTag

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("existing", "new")
      end

      it "reuses existing tags in the same space" do
        # Pre-create a tag in the space
        existing_tag = Tag.create!(name: "reusable", space: space, organization: organization)

        expect {
          AddTagsTool.call(
            object_id: document.id,
            object_type: "Document",
            tags: ["#reusable", "#new"],
            server_context: server_context
          )
        }.to change(Tag, :count).by(1) # Only the new tag should be created

        document.reload
        expect(document.tags).to include(existing_tag)
      end
    end

    context "adding tags to a table" do
      fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

      let(:table) { tables_tables(:projects) }

      it "adds tags to a table" do
        response = AddTagsTool.call(
          object_id: table.id,
          object_type: "Table",
          tags: ["#data", "#analytics"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#data", "#analytics")

        table.reload
        expect(table.tags.pluck(:name)).to contain_exactly("data", "analytics")
      end
    end

    context "authorization and error cases" do
      it "returns not found error response when document doesn't exist" do
        response = AddTagsTool.call(
          object_id: "nonexistent",
          object_type: "Document",
          tags: ["#test"],
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end

      it "returns not found error response when user doesn't have authorization" do
        unauthorized_context = {
          user_id: users(:maria).id,
          organization_id: organization.id
        }

        response = AddTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#test"],
          server_context: unauthorized_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end

      it "returns invalid input error response for unsupported object type" do
        response = AddTagsTool.call(
          object_id: document.id,
          object_type: "UnsupportedType",
          tags: ["#test"],
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
      end

      it "returns invalid input error response for invalid tag format" do
        response = AddTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#valid", "#invalid@tag", "#another&bad"],
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
      end
    end

    context "transaction rollback" do
      it "rolls back all changes if any tag validation fails" do
        expect {
          AddTagsTool.call(
            object_id: document.id,
            object_type: "Document",
            tags: ["#good", "#bad@tag"],
            server_context: server_context
          )
        }.to_not change(Tag, :count)

        expect {
          AddTagsTool.call(
            object_id: document.id,
            object_type: "Document",
            tags: ["#good", "#bad@tag"],
            server_context: server_context
          )
        }.to_not change(ObjectTag, :count)
      end
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(TagsService).to receive(:new).and_raise(RuntimeError, "Something went wrong")
        response = AddTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#test"],
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end

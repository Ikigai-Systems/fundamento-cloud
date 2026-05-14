require "rails_helper"

RSpec.describe RemoveTagsTool, type: :model do
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
    context "removing existing tags from a document" do
      before do
        # Set up some existing tags on the document
        @tag1 = Tag.create!(name: "biznes", space: space, organization: organization)
        @tag2 = Tag.create!(name: "marketing", space: space, organization: organization)
        @tag3 = Tag.create!(name: "strategia", space: space, organization: organization)

        ObjectTag.create!(tag: @tag1, object: document, organization: organization)
        ObjectTag.create!(tag: @tag2, object: document, organization: organization)
        ObjectTag.create!(tag: @tag3, object: document, organization: organization)
      end

      it "removes specified tags with # prefix" do
        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#biznes", "#marketing"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#strategia")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("strategia")
      end

      it "removes tags without # prefix" do
        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["biznes", "strategia"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#marketing")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("marketing")
      end

      it "handles case-insensitive tag removal" do
        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#BIZNES", "#Marketing"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#strategia")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("strategia")
      end

      it "keeps tags in the database after removal from object" do
        expect {
          expect {
            RemoveTagsTool.call(
              object_id: document.id,
              object_type: "Document",
              tags: ["#biznes", "#marketing"],
              server_context: server_context
            )
          }.to change(ObjectTag, :count).by(-2)
        }.to_not change(Tag, :count)

        # Verify tags still exist in database
        expect(Tag.find_by(name: "biznes", space: space)).to be_present
        expect(Tag.find_by(name: "marketing", space: space)).to be_present
      end

      it "gracefully handles removing non-existent tags" do
        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#biznes", "#nonexistent", "#marketing"],
          server_context: server_context
        )

        # Should still remove the existing tags
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#strategia")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("strategia")
      end

      it "gracefully handles removing tags not associated with the object" do
        # Create a tag that exists but isn't associated with this document
        unassociated_tag = Tag.create!(name: "unassociated", space: space, organization: organization)

        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#biznes", "#unassociated"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#marketing", "#strategia")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("marketing", "strategia")
      end
    end

    context "removing tags from a table" do
      fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

      let(:table) { tables_tables(:projects) }

      before do
        @table_tag = Tag.create!(name: "data", space: space, organization: organization)
        ObjectTag.create!(tag: @table_tag, object: table, organization: organization)
      end

      it "removes tags from a table" do
        response = RemoveTagsTool.call(
          object_id: table.id,
          object_type: "Table",
          tags: ["#data"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to be_empty

        table.reload
        expect(table.tags).to be_empty
      end
    end

    context "removing tags from object with no existing tags" do
      it "handles gracefully when object has no tags" do
        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "Document",
          tags: ["#nonexistent"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to be_empty

        document.reload
        expect(document.tags).to be_empty
      end
    end

    context "authorization and error cases" do
      before do
        @tag = Tag.create!(name: "test", space: space, organization: organization)
        ObjectTag.create!(tag: @tag, object: document, organization: organization)
      end

      it "returns not found error response when document doesn't exist" do
        response = RemoveTagsTool.call(
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

        response = RemoveTagsTool.call(
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
        response = RemoveTagsTool.call(
          object_id: document.id,
          object_type: "UnsupportedType",
          tags: ["#test"],
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
      end
    end

    context "transaction behavior" do
      before do
        @tag1 = Tag.create!(name: "tag1", space: space, organization: organization)
        @tag2 = Tag.create!(name: "tag2", space: space, organization: organization)
        ObjectTag.create!(tag: @tag1, object: document, organization: organization)
        ObjectTag.create!(tag: @tag2, object: document, organization: organization)
      end

      it "processes all tag removals in a transaction" do
        expect {
          RemoveTagsTool.call(
            object_id: document.id,
            object_type: "Document",
            tags: ["#tag1", "#tag2", "#nonexistent"],
            server_context: server_context
          )
        }.to change(ObjectTag, :count).by(-2)

        document.reload
        expect(document.tags).to be_empty
      end
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(TagsService).to receive(:new).and_raise(RuntimeError, "Something went wrong")
        response = RemoveTagsTool.call(
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

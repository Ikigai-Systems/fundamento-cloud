require "rails_helper"

RSpec.describe UpdateTagsTool, type: :model do
  fixtures :organizations, :users, :organization_users, :spaces, :space_memberships, :documents

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
    context "updating tags on a document with existing tags" do
      before do
        # Set up existing tags on the document
        @existing_tag1 = Tag.create!(name: "old1", space: space, organization: organization)
        @existing_tag2 = Tag.create!(name: "old2", space: space, organization: organization)
        
        ObjectTag.create!(tag: @existing_tag1, object: document, organization: organization)
        ObjectTag.create!(tag: @existing_tag2, object: document, organization: organization)
      end

      it "replaces all existing tags with new ones" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: ["#new1", "#new2", "#new3"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#new1", "#new2", "#new3")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("new1", "new2", "new3")
      end

      it "creates new tags if they don't exist" do
        expect {
          UpdateTagsTool.call(
            object_npi: document.npi,
            object_type: "Document",
            tags: ["#brand_new", "#another_new"],
            server_context: server_context
          )
        }.to change(Tag, :count).by(2)

        # Verify the new tags were created in the correct space
        expect(Tag.find_by(name: "brand_new", space: space)).to be_present
        expect(Tag.find_by(name: "another_new", space: space)).to be_present
      end

      it "reuses existing tags when possible" do
        # Create a tag that already exists
        existing_tag = Tag.create!(name: "reusable", space: space, organization: organization)

        expect {
          UpdateTagsTool.call(
            object_npi: document.npi,
            object_type: "Document",
            tags: ["#reusable", "#new_tag"],
            server_context: server_context
          )
        }.to change(Tag, :count).by(1) # Only the new tag should be created

        document.reload
        expect(document.tags).to include(existing_tag)
        expect(document.tags.pluck(:name)).to contain_exactly("reusable", "new_tag")
      end

      it "removes all tags when empty array is provided" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: [],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to be_empty

        document.reload
        expect(document.tags).to be_empty
      end

      it "keeps old tags in database after removal from object" do
        original_tag_count = Tag.count

        UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: ["#completely_different"],
          server_context: server_context
        )

        # Should have created 1 new tag but kept the old ones
        expect(Tag.count).to eq(original_tag_count + 1)
        expect(@existing_tag1.reload).to be_present
        expect(@existing_tag2.reload).to be_present
      end
    end

    context "updating tags on a document with no existing tags" do
      it "adds new tags to an object with no existing tags" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: ["#first", "#second"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#first", "#second")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("first", "second")
      end

      it "handles empty tag array on object with no existing tags" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: [],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to be_empty

        document.reload
        expect(document.tags).to be_empty
      end
    end

    context "tag normalization" do
      it "normalizes tags without # prefix" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: ["business", "marketing"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#business", "#marketing")
      end

      it "normalizes tag names to lowercase" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: ["#BUSINESS", "#Marketing", "#BUSINESS/Strategy"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#business", "#marketing", "#business/strategy")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("business", "marketing", "business/strategy")
      end

      it "skips empty tag names" do
        response = UpdateTagsTool.call(
          object_npi: document.npi,
          object_type: "Document",
          tags: ["#valid", "", "#", "#another_valid"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#valid", "#another_valid")

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("valid", "another_valid")
      end
    end

    context "updating tags on tables" do
      fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

      let(:table) { tables_tables(:projects) }

      it "updates tags on a table" do
        response = UpdateTagsTool.call(
          object_npi: table.id,
          object_type: "Table",
          tags: ["#data", "#analytics", "#reporting"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["tags"]).to contain_exactly("#data", "#analytics", "#reporting")

        table.reload
        expect(table.tags.pluck(:name)).to contain_exactly("data", "analytics", "reporting")
      end
    end

    context "authorization and error cases" do
      it "raises RecordNotFound when document doesn't exist" do
        expect {
          UpdateTagsTool.call(
            object_npi: "nonexistent",
            object_type: "Document",
            tags: ["#test"],
            server_context: server_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "raises error when user doesn't have authorization" do
        unauthorized_context = {
          user_id: users(:maria).id,
          organization_id: organization.id
        }

        expect {
          UpdateTagsTool.call(
            object_npi: document.npi,
            object_type: "Document",
            tags: ["#test"],
            server_context: unauthorized_context
          )
        }.to raise_error(ActiveRecord::RecordNotFound)
      end

      it "raises ArgumentError for unsupported object type" do
        expect {
          UpdateTagsTool.call(
            object_npi: document.npi,
            object_type: "UnsupportedType",
            tags: ["#test"],
            server_context: server_context
          )
        }.to raise_error(ArgumentError, "Unsupported object_type: UnsupportedType")
      end

      it "validates tag format and raises validation error for invalid tags" do
        expect {
          UpdateTagsTool.call(
            object_npi: document.npi,
            object_type: "Document",
            tags: ["#valid", "#invalid@tag"],
            server_context: server_context
          )
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context "atomic transaction behavior" do
      before do
        @existing_tag = Tag.create!(name: "existing", space: space, organization: organization)
        ObjectTag.create!(tag: @existing_tag, object: document, organization: organization)
      end

      it "rolls back all changes if any tag validation fails" do
        original_object_tag_count = ObjectTag.count
        original_tag_count = Tag.count

        expect {
          expect {
            UpdateTagsTool.call(
              object_npi: document.npi,
              object_type: "Document",
              tags: ["#good", "#bad@tag"],
              server_context: server_context
            )
          }.to raise_error(ActiveRecord::RecordInvalid)
        }.to_not change(Tag, :count)

        # Should still have the original ObjectTag association
        expect(ObjectTag.count).to eq(original_object_tag_count)
        
        document.reload
        expect(document.tags).to contain_exactly(@existing_tag)
      end

      it "completely replaces tags in a single transaction" do
        expect {
          UpdateTagsTool.call(
            object_npi: document.npi,
            object_type: "Document",
            tags: ["#new1", "#new2"],
            server_context: server_context
          )
        }.to change(ObjectTag.where(object: document), :count).from(1).to(2)
         .and change(Tag, :count).by(2)

        document.reload
        expect(document.tags.pluck(:name)).to contain_exactly("new1", "new2")
        expect(document.tags).not_to include(@existing_tag)
      end
    end
  end
end
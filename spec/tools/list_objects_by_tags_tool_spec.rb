require "rails_helper"

RSpec.describe ListObjectsByTagsTool, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :tags, :object_tags

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:document) { documents(:one) }

  let(:server_context) do
    {
      user_id: user.id,
      organization_id: organization.id
    }
  end

  describe ".call" do
    context "listing documents by tags" do
      before do
        # Document :one already has tags from fixtures: status/wip and project/tomorrow
      end

      it "returns documents that have all specified tags" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip", "#project/tomorrow"],
          object_types: ["Document"],
          server_context: server_context
        )

        expect(response).to be_a(MCP::Tool::Response)
        expect(response.content).to be_an(Array)
        expect(response.content.first[:type]).to eq("text")

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["message"]).to include("Found 1 objects")
        expect(json_response["requested_tags"]).to contain_exactly("#status/wip", "#project/tomorrow")
        expect(json_response["objects"].length).to eq(1)

        object = json_response["objects"].first
        expect(object["id"]).to eq(document.id)
        expect(object["title"]).to eq(document.title)
        expect(object["object_type"]).to eq("Document")
        expect(object["tags"]).to include("#status/wip", "#project/tomorrow")
        expect(object["space_id"]).to eq(space.id)
        expect(object["updated_at"]).to be_present
      end

      it "normalizes tags by removing # prefix and converting to lowercase" do
        response = ListObjectsByTagsTool.call(
          tags: ["STATUS/WIP", "PROJECT/TOMORROW"],
          object_types: ["Document"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["objects"].length).to eq(1)
      end

      it "returns empty array when no documents have all specified tags" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip", "#nonexistent"],
          object_types: ["Document"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["message"]).to include("Some tags were not found")
        expect(json_response["missing_tags"]).to contain_exactly("#nonexistent")
        expect(json_response["objects"]).to eq([])
      end

      it "only returns documents with ALL tags, not just some" do
        # Create another document with only one of the tags
        another_doc = Document.create!(
          title: "Another Document",
          organization: organization,
          space: space
        )
        ObjectTag.create!(
          tag: tags(:is_status_wip),
          object: another_doc,
          organization: organization
        )

        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip", "#project/tomorrow"],
          object_types: ["Document"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["objects"].length).to eq(1)
        expect(json_response["objects"].first["id"]).to eq(document.id)
      end
    end

    context "listing tables by tags" do
      fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

      let(:table) { tables_tables(:projects) }

      before do
        # Add tags to the table
        ObjectTag.create!(
          tag: tags(:is_status_wip),
          object: table,
          organization: organization
        )
        ObjectTag.create!(
          tag: tags(:is_project_nemesis),
          object: table,
          organization: organization
        )
      end

      it "returns tables that have all specified tags" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip", "#project/nemesis"],
          object_types: ["Table"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["message"]).to include("Found 1 objects")
        expect(json_response["objects"].length).to eq(1)

        object = json_response["objects"].first
        expect(object["id"]).to eq(table.id)
        expect(object["name"]).to eq(table.name)
        expect(object["object_type"]).to eq("Table")
        expect(object["tags"]).to include("#status/wip", "#project/nemesis")
        expect(object["space_id"]).to eq(space.id)
      end
    end

    context "listing both documents and tables" do
      fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

      let(:table) { tables_tables(:projects) }

      before do
        # Document :one already has status/wip tag
        # Add the same tag to the table
        ObjectTag.create!(
          tag: tags(:is_status_wip),
          object: table,
          organization: organization
        )
      end

      it "returns both documents and tables when object_types not specified" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["message"]).to include("Found 2 objects")
        expect(json_response["objects"].length).to eq(2)

        object_types = json_response["objects"].map { |obj| obj["object_type"] }
        expect(object_types).to contain_exactly("Document", "Table")
      end

      it "returns both documents and tables when object_types includes both" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip"],
          object_types: ["Document", "Table"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["objects"].length).to eq(2)
      end
    end

    context "filtering by space" do
      let(:another_space) { spaces(:is_stefans) }
      let(:another_doc) do
        Document.create!(
          title: "Document in Another Space",
          organization: organization,
          space: another_space
        )
      end

      before do
        # Create a tag in the other space
        tag = Tag.create!(
          name: "private",
          organization: organization,
          space: another_space
        )
        ObjectTag.create!(
          tag: tag,
          object: another_doc,
          organization: organization
        )
      end

      it "only returns objects from the specified space" do
        response = ListObjectsByTagsTool.call(
          tags: ["#private"],
          space_id: another_space.id,
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["objects"].length).to eq(1)
        expect(json_response["objects"].first["space_id"]).to eq(another_space.id)
      end

      it "does not return objects from other spaces" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip"],
          space_id: another_space.id,
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        # status/wip tag exists in default space but not in another_space
        expect(json_response["message"]).to include("Some tags were not found")
        expect(json_response["missing_tags"]).to contain_exactly("#status/wip")
      end

      it "returns not found error response when space doesn't exist" do
        response = ListObjectsByTagsTool.call(
          tags: ["#test"],
          space_id: "nonexistent",
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end
    end

    context "authorization and access control" do
      let(:hc_org) { organizations(:hc) }
      let(:hc_private_space) { spaces(:hc_pawels) }
      let(:maria_user) { users(:maria) }
      let(:maria_context) do
        {
          user_id: maria_user.id,
          organization_id: hc_org.id
        }
      end

      before do
        # Create a document in Pawel's private space in HC org
        @private_doc = Document.create!(
          title: "Private Document",
          organization: hc_org,
          space: hc_private_space
        )
        # Add a tag to it
        tag = Tag.create!(name: "private", organization: hc_org, space: hc_private_space)
        ObjectTag.create!(tag: tag, object: @private_doc, organization: hc_org)
      end

      it "skips objects the user cannot access" do
        # Maria belongs to HC org but can't access Pawel's private space
        response = ListObjectsByTagsTool.call(
          tags: ["#private"],
          server_context: maria_context
        )

        json_response = JSON.parse(response.content.first[:text])
        # Maria can't see the document in the private space, so it should be empty
        expect(json_response["objects"]).to eq([])
      end

      it "returns not found error response when user doesn't belong to the organization" do
        invalid_context = {
          user_id: user.id,
          organization_id: organizations(:another).id
        }

        response = ListObjectsByTagsTool.call(
          tags: ["#test"],
          server_context: invalid_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("not_found")
      end

      it "returns unauthorized error response when user cannot access the specified space" do
        # Use Maria's context to try to access a private space she can't see
        response = ListObjectsByTagsTool.call(
          tags: ["#private"],
          space_id: hc_private_space.id,
          server_context: maria_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("unauthorized")
      end
    end

    context "error cases and validation" do
      it "returns invalid input error response for invalid object_types" do
        response = ListObjectsByTagsTool.call(
          tags: ["#test"],
          object_types: ["InvalidType"],
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
      end

      it "returns invalid input error response for mixed valid and invalid object_types" do
        response = ListObjectsByTagsTool.call(
          tags: ["#test"],
          object_types: ["Document", "InvalidType"],
          server_context: server_context
        )
        expect(response).to be_a(MCP::Tool::Response)
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("invalid_input")
      end

      it "returns message about missing tags when tags don't exist" do
        response = ListObjectsByTagsTool.call(
          tags: ["#nonexistent1", "#nonexistent2"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["message"]).to include("Some tags were not found")
        expect(json_response["missing_tags"]).to contain_exactly("#nonexistent1", "#nonexistent2")
        expect(json_response["objects"]).to eq([])
      end
    end

    context "edge cases" do
      it "handles single tag correctly" do
        response = ListObjectsByTagsTool.call(
          tags: ["#status/wip"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["objects"].length).to be >= 1
      end

      it "returns empty when no objects match all tags" do
        # Create tags but don't assign them to any objects
        Tag.create!(name: "unused1", organization: organization, space: space)
        Tag.create!(name: "unused2", organization: organization, space: space)

        response = ListObjectsByTagsTool.call(
          tags: ["#unused1", "#unused2"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["message"]).to include("Found 0 objects")
        expect(json_response["objects"]).to eq([])
      end

      it "handles tags with special characters in hierarchy" do
        # Create tags with slashes (hierarchical)
        tag1 = Tag.create!(name: "project/sub/deep", organization: organization, space: space)
        tag2 = Tag.create!(name: "status/in-progress", organization: organization, space: space)

        doc = Document.create!(
          title: "Deep Tagged Doc",
          organization: organization,
          space: space
        )
        ObjectTag.create!(tag: tag1, object: doc, organization: organization)
        ObjectTag.create!(tag: tag2, object: doc, organization: organization)

        response = ListObjectsByTagsTool.call(
          tags: ["#project/sub/deep", "#status/in-progress"],
          server_context: server_context
        )

        json_response = JSON.parse(response.content.first[:text])
        expect(json_response["objects"].length).to eq(1)
        expect(json_response["objects"].first["id"]).to eq(doc.id)
      end
    end

    context "when an unexpected error occurs" do
      it "returns an internal error response and reports to Sentry" do
        expect(Sentry).to receive(:capture_exception).with(instance_of(RuntimeError), anything)
        allow(organization).to receive(:tags).and_raise(RuntimeError, "Something went wrong")
        allow_any_instance_of(PolicyUserContext).to receive(:current_organization).and_return(organization)
        response = ListObjectsByTagsTool.call(
          tags: ["#test"],
          server_context: server_context
        )
        expect(response.error?).to be true
        expect(response.structured_content[:error]).to eq("internal_error")
      end
    end
  end
end

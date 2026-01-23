require "rails_helper"

RSpec.describe Objects::TagsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :tags, :object_tags

  let(:pawel) { users(:pawel) }
  let(:stefan) { users(:stefan) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:document_one) { documents(:one) }
  let(:document_two) { documents(:two) }
  let(:is_policy_tag) { tags(:is_policy) }
  let(:is_status_wip_tag) { tags(:is_status_wip) }
  let(:is_status_done_tag) { tags(:is_status_done) }

  # Create tables dynamically since table fixtures have issues with nested fixtures
  let(:table_one) do
    Table.find_or_create_by!(id: "test_table_one") do |table|
      table.name = "Test Table One"
      table.organization = ikigai_systems
      table.space = is_default_space
      table.parent = is_default_space
    end
  end

  before do
    sign_in pawel
    post select_organization_path(ikigai_systems)
  end

  describe "POST /d/:document_id/tags (update document tags)" do
    context "when adding new tags to a document" do
      it "replaces existing tags with new ones" do
        # Document one starts with tags from fixtures
        initial_tag_names = document_one.tags.pluck(:name)
        expect(initial_tag_names).to include("status/wip", "project/tomorrow")

        post document_tags_path(document_one),
          params: { tags: ["replaced-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)

        document_one.reload
        tag_names = document_one.tags.pluck(:name)
        expect(tag_names).to eq(["replaced-tag"])
        expect(tag_names).not_to include("status/wip", "project/tomorrow")
      end

      it "reuses existing tags in the space instead of creating duplicates" do
        # First, create a tag
        post document_tags_path(document_one),
          params: { tags: ["reusable-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(Tag.where(name: "reusable-tag", space: is_default_space).count).to eq(1)

        # Now use the same tag on a different document
        post document_tags_path(document_two),
          params: { tags: ["reusable-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        # Should still only have one tag in the space
        expect(Tag.where(name: "reusable-tag", space: is_default_space).count).to eq(1)

        # Both documents should have the same tag
        tag = Tag.find_by(name: "reusable-tag", space: is_default_space)
        expect(document_one.reload.tags).to include(tag)
        expect(document_two.reload.tags).to include(tag)
      end

      it "supports hierarchical tags with slashes" do
        post document_tags_path(document_one),
          params: { tags: ["category/subcategory/item"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)

        document_one.reload
        tag = document_one.tags.find_by(name: "category/subcategory/item")
        expect(tag).to be_present
        expect(tag.depth).to eq(2)
        expect(tag.root_name).to eq("category")
        expect(tag.leaf_name).to eq("item")
      end

      it "removes all tags when empty array is provided" do
        # Ensure document has tags first
        expect(document_one.tags).not_to be_empty

        post document_tags_path(document_one),
          params: { tags: [] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)

        document_one.reload
        expect(document_one.tags).to be_empty
      end

      it "renders turbo_stream replacing the tags sidebar component" do
        post document_tags_path(document_one),
          params: { tags: ["test-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("turbo-stream")
        expect(response.body).to include("replace")
        expect(response.body).to include("tags")
      end
    end

    context "when not authenticated" do
      before do
        sign_out pawel
      end

      it "redirects to sign in" do
        post document_tags_path(document_one),
          params: { tags: ["test-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:redirect)
        expect(response).to redirect_to(new_user_session_path)
      end
    end

  end

  describe "POST /t/:table_id/tags (update table tags)" do
    context "when adding new tags to a table" do
      it "replaces existing tags with new ones" do
        # Add initial tags
        TagsService.new(object: table_one, organization: ikigai_systems).add_tags(["initial-tag"])

        post table_tags_path(table_one),
          params: { tags: ["replaced-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)

        table_one.reload
        tag_names = table_one.tags.pluck(:name)
        expect(tag_names).to eq(["replaced-tag"])
        expect(tag_names).not_to include("initial-tag")
      end

      it "shares tags between documents and tables in the same space" do
        # Add a tag to a document
        post document_tags_path(document_one),
          params: { tags: ["shared-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(Tag.where(name: "shared-tag", space: is_default_space).count).to eq(1)

        # Use the same tag on a table
        post table_tags_path(table_one),
          params: { tags: ["shared-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        # Should still only have one tag in the space
        expect(Tag.where(name: "shared-tag", space: is_default_space).count).to eq(1)

        # Both document and table should share the tag
        shared_tag = Tag.find_by(name: "shared-tag", space: is_default_space)
        expect(document_one.tags).to include(shared_tag)
        expect(table_one.tags).to include(shared_tag)
      end

      it "supports hierarchical tags with slashes" do
        post table_tags_path(table_one),
          params: { tags: ["table/category/item"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)

        table_one.reload
        tag = table_one.tags.find_by(name: "table/category/item")
        expect(tag).to be_present
        expect(tag.depth).to eq(2)
        expect(tag.root_name).to eq("table")
        expect(tag.leaf_name).to eq("item")
      end

      it "removes all tags when empty array is provided" do
        # Add initial tags
        TagsService.new(object: table_one, organization: ikigai_systems).add_tags(["removable-tag"])
        expect(table_one.tags).not_to be_empty

        post table_tags_path(table_one),
          params: { tags: [] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)

        table_one.reload
        expect(table_one.tags).to be_empty
      end

      it "renders turbo_stream replacing the tags sidebar component" do
        post table_tags_path(table_one),
          params: { tags: ["test-table-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("turbo-stream")
        expect(response.body).to include("replace")
        expect(response.body).to include("tags")
      end
    end

    context "when not authenticated" do
      before do
        sign_out pawel
      end

      it "redirects to sign in" do
        post table_tags_path(table_one),
          params: { tags: ["test-tag"] },
          headers: { "Accept" => "text/vnd.turbo-stream.html" }

        expect(response).to have_http_status(:redirect)
        expect(response).to redirect_to(new_user_session_path)
      end
    end
  end

  describe "Tag normalization" do
    it "normalizes tag names (lowercase, trimmed)" do
      post document_tags_path(document_one),
        params: { tags: ["  UPPERCASE-TAG  "] },
        headers: { "Accept" => "text/vnd.turbo-stream.html" }

      expect(response).to have_http_status(:ok)

      document_one.reload
      tag_names = document_one.tags.pluck(:name)
      expect(tag_names).to include("uppercase-tag")
      expect(tag_names).not_to include("  UPPERCASE-TAG  ")
    end

    it "handles multiple tags with mixed case" do
      post document_tags_path(document_one),
        params: { tags: ["Tag-One", "tag-two", "TAG-THREE"] },
        headers: { "Accept" => "text/vnd.turbo-stream.html" }

      expect(response).to have_http_status(:ok)

      document_one.reload
      tag_names = document_one.tags.pluck(:name)
      expect(tag_names).to match_array(["tag-one", "tag-two", "tag-three"])
    end
  end
end

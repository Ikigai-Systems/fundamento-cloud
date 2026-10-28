require "rails_helper"

RSpec.describe "Api::V1::Documents", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_contents

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:document_one) { documents(:one) }
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test API Token for Pawel at IS"
    )
  end

  describe "GET /api/v1/documents" do
    context "with valid API token" do
      it "returns list of documents in the space" do
        get api_v1_documents_path(space_id: is_default_space.id),
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to be_an(Array)
        expect(json_response.length).to eq(2)

        first_doc = json_response.first
        expect(first_doc).to have_key("id")
        expect(first_doc).to have_key("title")
        expect(first_doc).to have_key("created_at")
        expect(first_doc).to have_key("updated_at")
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        get api_v1_documents_path(space_id: is_default_space.id),
          headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/documents/:npi" do
    context "when requesting blocknote blocks format (with .json or format=json)" do
      it "returns document with content as blocknote blocks" do
        # Mock the BlocknoteConverterService to return sample blocks
        sample_blocks = [
          {
            "id" => "block-1",
            "type" => "paragraph",
            "content" => [{ "type" => "text", "text" => "Hello World" }]
          }
        ]

        allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return(sample_blocks)

        get "/api/v1/documents/#{document_one.id}.json",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response["id"]).to eq(document_one.id)
        expect(json_response["title"]).to be_present
        expect(json_response["created_at"]).to be_present
        expect(json_response["updated_at"]).to be_present
        expect(json_response["content"]).to eq(sample_blocks)
        expect(json_response["tags"]).to be_an(Array)

        # Verify content is an array of blocks (not markdown string)
        expect(json_response["content"]).to be_an(Array)
        expect(json_response["content"].first).to have_key("id")
        expect(json_response["content"].first).to have_key("type")
      end
    end

    it "returns the icon separately from the title" do
      document_one.update!(title: "🔥 Hot Topic")
      allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return([])

      get "/api/v1/documents/#{document_one.id}.json",
        headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

      expect(response.parsed_body).to include("title" => "Hot Topic", "icon" => { "type" => "emoji", "value" => "🔥" })
    end

    context "when requesting markdown format (with .markdown or format=markdown)" do
      it "returns document with content as markdown string" do
        # Mock the BlocknoteConverterService methods
        sample_blocks = [
          {
            "id" => "block-1",
            "type" => "paragraph",
            "content" => [{ "type" => "text", "text" => "Hello World" }]
          }
        ]
        sample_markdown = "# Hello World\n\nThis is markdown content."

        allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return(sample_markdown)

        get "/api/v1/documents/#{document_one.id}.markdown",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)

        # expect(json_response["id"]).to eq(document_one.id)
        # expect(json_response["title"]).to be_present
        expect(response.body).to eq(sample_markdown)
        # expect(json_response["tags"]).to be_an(Array)

        # Verify to_markdown was called with the blocks
        expect(BlocknoteConverterService).to have_received(:blocks_to_markdown).with(sample_blocks)
      end
    end

    context "with the frontmatter parameter" do
      let(:markdown) { "# Hello World\n\nThis is markdown content." }
      let(:headers) { { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" } }

      before do
        allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return(markdown)
      end

      def style_document!
        document_one.assign_title_and_icon(title: "Plan: Q4 \"launch\" #1", icon: "🔥")
        document_one.assign_color("indigo")
        document_one.save!
        TagsService.new(object: document_one, organization: ikigai_systems).update_tags(["blog", "ikigai/blog"])
      end

      it "default markdown output has no frontmatter" do
        style_document!

        get "/api/v1/documents/#{document_one.id}.md", headers: headers

        expect(response.body).to eq(markdown)
      end

      it "frontmatter=true includes title, tags, fundamento/icon and fundamento/color" do
        style_document!

        get "/api/v1/documents/#{document_one.id}.md?frontmatter=true", headers: headers

        expect(response).to have_http_status(:ok)
        body, data = Class.new { include MarkdownFrontmatter }.new.extract_frontmatter(response.body)
        expect(data).to eq(
          "title" => "Plan: Q4 \"launch\" #1",
          "tags" => ["blog", "ikigai/blog"],
          "fundamento/icon" => "🔥",
          "fundamento/color" => "indigo"
        )
        expect(body).to eq(markdown)
        expect(response.body).to end_with("---\n\n#{markdown}")
      end

      it "keeps < and & raw in the frontmatter title" do
        document_one.update!(title: "Fish & <Chips>")

        get "/api/v1/documents/#{document_one.id}.md?frontmatter=true", headers: headers

        _body, data = Class.new { include MarkdownFrontmatter }.new.extract_frontmatter(response.body)
        expect(data["title"]).to eq("Fish & <Chips>")
      end

      %w[1 yes false TRUE].each do |value|
        it "frontmatter=#{value} is off" do
          style_document!

          get "/api/v1/documents/#{document_one.id}.md?frontmatter=#{value}", headers: headers

          expect(response.body).to eq(markdown)
        end
      end

      it "the JSON format ignores the parameter" do
        style_document!

        get "/api/v1/documents/#{document_one.id}.json", headers: headers
        plain = response.parsed_body

        get "/api/v1/documents/#{document_one.id}.json?frontmatter=true", headers: headers

        expect(response.parsed_body).to eq(plain)
        expect(response.parsed_body["content"]).to eq([])
      end
    end

    context "when document has versions" do
      it "returns content from the latest version" do
        # Create a version for the document
        version = document_one.versions.create!(
          content_blocks: [
            {
              "id" => "version-block-1",
              "type" => "paragraph",
              "content" => [{ "type" => "text", "text" => "Versioned Content" }]
            }
          ]
        )

        # Stub the service to verify it's not called
        allow(BlocknoteConverterService).to receive(:yjs_to_blocks)

        get "/api/v1/documents/#{document_one.id}.json",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        # Verify it uses version content, not document.to_blocks
        expect(json_response["content"]).to eq(version.content_blocks)
        expect(BlocknoteConverterService).not_to have_received(:yjs_to_blocks)
      end

      it "converts versioned content to markdown when format is markdown" do
        version = document_one.versions.create!(
          content_blocks: [
            {
              "id" => "version-block-1",
              "type" => "paragraph",
              "content" => [{ "type" => "text", "text" => "Versioned Content" }]
            }
          ]
        )

        sample_markdown = "# Versioned Content"
        allow(BlocknoteConverterService).to receive(:blocks_to_markdown).and_return(sample_markdown)

        get "/api/v1/documents/#{document_one.id}.markdown",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to eq(sample_markdown)
        expect(BlocknoteConverterService).to have_received(:blocks_to_markdown).with(version.content_blocks)
      end
    end

    context "with document tags" do
      it "includes tags in the response" do
        # Create tags for the document (tags belong to space)
        tag1 = is_default_space.tags.create!(name: "business", organization: ikigai_systems)
        tag2 = is_default_space.tags.create!(name: "important", organization: ikigai_systems)

        document_one.object_tags.create!(tag: tag1, organization: ikigai_systems)
        document_one.object_tags.create!(tag: tag2, organization: ikigai_systems)

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        allow(BlocknoteConverterService).to receive(:yjs_to_blocks).and_return(sample_blocks)

        get "/api/v1/documents/#{document_one.id}.json",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response["tags"]).to contain_exactly("#business", "#important")
      end
    end

    context "with invalid document npi" do
      it "returns not found" do
        get "/api/v1/documents/invalid-npi",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        get "/api/v1/documents/#{document_one.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_organization_membership) { organization_memberships(:om_hc_pawel) }
      let!(:other_org_token) do
        ApiToken.create!(
          organization: other_org,
          organization_membership: other_organization_membership,
          title: "Test API Token for Other Org"
        )
      end

      it "returns not found when accessing document from different organization" do
        get "/api/v1/documents/#{document_one.id}",
          headers: { "Authorization" => "Bearer #{other_org_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/documents" do
    context "with valid API token" do
      it "creates a document with title only" do
        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: {
              document: {
                title: "New Test Document",
                markdown: "Test Content"
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["id"]).to be_present
        expect(json_response["title"]).to eq("New Test Document")
        expect(json_response["created_at"]).to be_present
        expect(json_response["updated_at"]).to be_present

        # Verify document is in space hierarchy
        is_default_space.reload
        created_doc = Document.find_by(id: json_response["id"])
        expect(is_default_space.hierarchy).to include(
          hash_including("id" => created_doc.id)
        )
      end

      it "creates a document with an icon" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: { document: { title: "Roadmap", icon: "🗺️", markdown: "Plans" } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)
        expect(response.parsed_body).to include("title" => "Roadmap", "icon" => { "type" => "emoji", "value" => "🗺️" })
      end

      it "creates a document without title (defaults to 'Untitled')" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              markdown: "Test Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["title"]).to eq("Untitled")
      end

      it "creates a document with markdown content" do
        markdown_content = "# Hello World\n\nThis is a test document."

        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: {
              document: {
                title: "Document with Content",
                markdown: markdown_content
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)
         .and change(Version, :count).by(1)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        created_doc = Document.find_by(id: json_response["id"])
        expect(created_doc.versions.count).to eq(1)
     end

      it "creates a document with tags from frontmatter" do
        markdown_with_frontmatter = file_fixture("documents/with_tags_frontmatter.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Hello World" }] }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)

        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: {
              document: {
                title: "Document with Frontmatter Tags",
                markdown: markdown_with_frontmatter
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)
         .and change(Tag, :count).by(3)
         .and change(ObjectTag, :count).by(3)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        created_doc = Document.find_by(id: json_response["id"])
        expect(created_doc.tags.count).to eq(3)
        expect(created_doc.tags.pluck(:name)).to contain_exactly(
          "rok/2024/05",
          "osobiste/refleksje",
          "osobiste/rozwój"
        )

        # Verify tags belong to the correct space
        created_doc.tags.each do |tag|
          expect(tag.space).to eq(is_default_space)
          expect(tag.organization).to eq(ikigai_systems)
        end

        # Verify markdown content was processed without frontmatter
        expect(BlocknoteConverterService).to have_received(:markdown_to_blocks) do |markdown|
          expect(markdown).not_to include("---")
          expect(markdown).not_to include("tags:")
          expect(markdown).to include("# Hello World")
        end
      end

      it "creates a document when frontmatter has no tags" do
        markdown_with_frontmatter = file_fixture("documents/no_tags_frontmatter.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)

        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: {
              document: {
                title: "Document with Non-Tag Frontmatter",
                markdown: markdown_with_frontmatter
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)
         .and change(Tag, :count).by(0)

        expect(response).to have_http_status(:created)
      end

      it "reuses existing tags when creating document with frontmatter" do
        # Create existing tags
        existing_tag = is_default_space.tags.create!(
          name: "existing/tag",
          organization: ikigai_systems
        )

        markdown_with_frontmatter = file_fixture("documents/reuse_tags.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)

        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: {
              document: {
                title: "Document Reusing Tags",
                markdown: markdown_with_frontmatter
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)
         .and change(Tag, :count).by(1) # Only 1 new tag created

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        created_doc = Document.find_by(id: json_response["id"])
        expect(created_doc.tags.count).to eq(2)
        expect(created_doc.tags).to include(existing_tag)
      end

      it "keeps a list between two --- lines as content instead of failing" do
        markdown = "---\n- just\n- a list\n---\n# Hello\n"

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([{ "id" => "1", "type" => "paragraph" }])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return({ "data" => "yjs_sync_data" })

        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: { document: { title: "Document with Horizontal Rules", markdown: markdown } },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)
         .and change(Tag, :count).by(0)

        expect(response).to have_http_status(:created)
        expect(BlocknoteConverterService).to have_received(:markdown_to_blocks).with(markdown)
      end

      it "creates a nested document under a parent" do
        parent_doc = is_default_space.documents.create!(
          title: "Parent Document",
          organization: ikigai_systems
        )

        # Add parent to hierarchy
        hierarchy_node = is_default_space.create_hierarchy_node(parent_doc.id)
        is_default_space.hierarchy.append(hierarchy_node)
        is_default_space.save!

        expect {
          post api_v1_documents_path(space_id: is_default_space.id),
            params: {
              document: {
                title: "Child Document",
                markdown: "Test Content",
                parent_document_id: parent_doc.id
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        # Verify child is nested under parent in hierarchy
        is_default_space.reload
        created_doc = Document.find_by(id: json_response["id"])

        # Find parent node in hierarchy
        parent_node = is_default_space.hierarchy.find { |node| node["id"] == parent_doc.id }
        expect(parent_node).to be_present
        expect(parent_node["children"]).to include(
          hash_including("id" => created_doc.id)
        )
      end

      it "creates document at space root when parent doesn't exist in hierarchy" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Root Document",
              markdown: "Test Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)

        # Verify document is at root level of hierarchy
        is_default_space.reload
        json_response = JSON.parse(response.body)
        created_doc = Document.find_by(id: json_response["id"])

        expect(is_default_space.hierarchy).to include(
          hash_including("id" => created_doc.id)
        )
      end

      it "sets created_by on version when creating with content" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])

        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Document with Author",
              markdown: "Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        created_doc = Document.find_by(id: json_response["id"])
        expect(created_doc.versions.last.created_by).to eq(pawel)
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Test Document"
            }
          },
          headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Test Document"
            }
          }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_organization_membership) { organization_memberships(:om_hc_pawel) }
      let!(:other_org_token) do
        ApiToken.create!(
          organization: other_org,
          organization_membership: other_organization_membership,
          title: "Test API Token for Other Org"
        )
      end

      it "returns not found when trying to create in space from different organization" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Test Document",
              markdown: "Test Content"
            }
          },
          headers: { "Authorization" => "Bearer #{other_org_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with invalid space npi" do
      it "returns not found" do
        post api_v1_documents_path(space_id: "invalid-npi"),
          params: {
            document: {
              title: "Test Document",
              markdown: "Test Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with invalid parent document npi" do
      it "returns not found" do
        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Test Document",
              markdown: "Test Content",
              parent_document_id: "invalid-npi"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when BlocknoteConverterService fails" do
      it "returns internal server error" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
          .and_raise(BlocknoteConverterService::ConversionError.new("Conversion failed"))

        post api_v1_documents_path(space_id: is_default_space.id),
          params: {
            document: {
              title: "Test Document",
              markdown: "Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "PATCH/PUT /api/v1/documents/:npi" do
    context "with valid API token" do
      it "updates document with new markdown content" do
        markdown_content = file_fixture("documents/updated_content.md").read

        expect {
          patch api_v1_document_path(id: document_one.id),
            params: {
              document: {
                markdown: markdown_content
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Version, :count).by(1)

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response["id"]).to eq(document_one.id)
        expect(json_response["title"]).to eq(document_one.title)
        expect(json_response["updated_at"]).to be_present

        # Verify new version was created
        document_one.reload
        expect(document_one.versions.count).to eq(1)
      end

      it "updates document with tags from frontmatter" do
        markdown_with_frontmatter = file_fixture("documents/updated_with_tags.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Updated Content" }] }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)

        expect {
          patch api_v1_document_path(id: document_one.id),
            params: {
              document: {
                markdown: markdown_with_frontmatter
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Tag, :count).by(2)
         .and change(ObjectTag, :count).by(2)

        expect(response).to have_http_status(:ok)

        document_one.reload
        expect(document_one.tags.count).to eq(2)
        expect(document_one.tags.pluck(:name)).to contain_exactly("updated/tag1", "updated/tag2")

        # Verify markdown content was processed without frontmatter
        expect(BlocknoteConverterService).to have_received(:markdown_to_blocks) do |markdown|
          expect(markdown).not_to include("---")
          expect(markdown).not_to include("tags:")
          expect(markdown).to include("# Updated Content")
        end
      end

      it "replaces existing tags when updating with new frontmatter tags" do
        # Create initial tags
        initial_tag = is_default_space.tags.create!(name: "initial/tag", organization: ikigai_systems)
        document_one.object_tags.create!(tag: initial_tag, organization: ikigai_systems)

        markdown_with_frontmatter = file_fixture("documents/replace_tags.md").read

        sample_blocks = [{ "id" => "1", "type" => "paragraph" }]
        sample_sync = { "data" => "yjs_sync_data" }

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)

        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: markdown_with_frontmatter
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)

        document_one.reload
        expect(document_one.tags.count).to eq(2)
        expect(document_one.tags).not_to include(initial_tag)
        expect(document_one.tags.pluck(:name)).to contain_exactly("new/tag1", "new/tag2")
      end

      it "sets created_by on new version" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return({})

        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: "Updated Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)

        document_one.reload
        expect(document_one.versions.last.created_by).to eq(pawel)
      end

      it "updates document sync field" do
        sample_blocks = file_fixture("blocknote/colored_texts.json").read
        sample_sync = file_fixture("blocknote/colored_texts.sync").binread

        allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return(sample_sync)

        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: "# Updated Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)

        document_one.reload
        expect(document_one.content.sync).to eq(sample_sync)
      end
    end

    context "renaming" do
      it "renames the document without creating a version" do
        expect {
          patch api_v1_document_path(id: document_one.id),
            params: { document: { title: "Renamed" } },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.not_to change(Version, :count)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["title"]).to eq("Renamed")
        expect(document_one.reload.title).to eq("Renamed")
      end

      it "rejects a blank title" do
        patch api_v1_document_path(id: document_one.id),
          params: { document: { title: "" } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "rejects a request with neither title nor markdown" do
        patch api_v1_document_path(id: document_one.id),
          params: { document: { parent_document_id: "x" } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]["base"]).to eq("Provide a title, icon, color, or markdown")
      end
    end

    context "icon" do
      it "sets the icon and returns it" do
        patch api_v1_document_path(id: document_one.id),
          params: { document: { icon: "🔥" } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["icon"]).to eq("type" => "emoji", "value" => "🔥")
        expect(document_one.reload.icon).to eq(Icon.emoji("🔥"))
      end

      it "rejects an icon that isn't a single emoji" do
        patch api_v1_document_path(id: document_one.id),
          params: { document: { icon: "fire" } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "color" do
      let(:headers) { { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" } }
      let(:all_names) { HasColor::NAMES.join(", ") }

      def patch_color(document, color, headers: self.headers)
        patch api_v1_document_path(id: document.id), params: { document: { color: color } }, headers: headers, as: :json
      end

      it "sets the color and returns its name" do
        patch_color(document_one, "Indigo")

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["color"]).to eq("indigo")
        expect(document_one.reload.color).to eq("indigo")
        expect(document_one.title).to eq(documents(:one).title)
      end

      it "clears the color with an empty string" do
        document_one.update!(color: "blue")

        patch_color(document_one, "")

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["color"]).to be_nil
        expect(document_one.reload.color).to be_nil
      end

      it "leaves the color unchanged when omitted" do
        document_one.update!(color: "blue")

        patch api_v1_document_path(id: document_one.id), params: { document: { title: "Renamed" } }, headers: headers

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["color"]).to eq("blue")
        expect(document_one.reload.color).to eq("blue")
      end

      it "rejects an unknown color with 422 and a message naming the eight colors" do
        document_one.update!(color: "blue")

        patch_color(document_one, "chartreuse")

        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
        expect(document_one.reload.color).to eq("blue")
      end

      it "rejects a color that isn't a string with 422" do
        [5, true].each do |value|
          patch_color(document_one, value)

          expect(response).to have_http_status(:unprocessable_entity)
          expect(response.parsed_body["errors"]["base"]).to eq("Color must be one of: #{all_names}")
        end
        expect(document_one.reload.color).to be_nil
      end

      it "rejects a user without edit permission and leaves the color alone" do
        private_space = ikigai_systems.spaces.create!(name: "Locked Room", access_mode: :private)
        document = private_space.documents.create!(title: "Secret", organization: ikigai_systems, color: "blue")
        stefan_token = ApiToken.create!(
          organization: ikigai_systems,
          organization_membership: organization_memberships(:om_is_stefan),
          title: "Stefan"
        )

        patch_color(document, "crimson", headers: { "Authorization" => "Bearer #{stefan_token.encrypted_token}" })

        expect(response).to have_http_status(:forbidden)
        expect(document.reload.color).to eq("blue")
      end

      it "always includes color in the document JSON" do
        get api_v1_document_path(id: document_one.id, format: :json), headers: headers
        expect(response.parsed_body).to have_key("color")
        expect(response.parsed_body["color"]).to be_nil

        get api_v1_documents_path(space_id: is_default_space.id), headers: headers
        expect(response.parsed_body).to all(have_key("color"))
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: "Updated Content"
            }
          },
          headers: { "Authorization" => "Bearer invalid_token" }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: "Updated Content"
            }
          }

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_organization_membership) { organization_memberships(:om_hc_pawel) }
      let!(:other_org_token) do
        ApiToken.create!(
          organization: other_org,
          organization_membership: other_organization_membership,
          title: "Test API Token for Other Org"
        )
      end

      it "returns not found when updating document from different organization" do
        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: "Updated Content"
            }
          },
          headers: { "Authorization" => "Bearer #{other_org_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with invalid document npi" do
      it "returns not found" do
        patch api_v1_document_path(id: "invalid-npi"),
          params: {
            document: {
              markdown: "Updated Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when BlocknoteConverterService fails" do
      it "returns unprocessable entity" do
        allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
          .and_raise(BlocknoteConverterService::ConversionError.new("Conversion failed"))

        patch api_v1_document_path(id: document_one.id),
          params: {
            document: {
              markdown: "Updated Content"
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["errors"]["markdown"]).to eq("Conversion failed")
      end
    end
  end
end

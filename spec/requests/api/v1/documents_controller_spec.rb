require "rails_helper"

RSpec.describe "Api::V1::Documents", type: :request do
  fixtures :organizations, :users, :organization_users, :spaces, :documents

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:document_one) { documents(:one) }
  let(:pawel_ikigai_systems) { organization_users(:ou_is_pawel) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_user: pawel_ikigai_systems,
      title: "Test API Token for Pawel at IS"
    )
  end

  describe "GET /api/v1/spaces/:space_npi/documents" do
    context "with valid API token" do
      it "returns list of documents in the space" do
        get "/api/v1/spaces/#{is_default_space.npi}/documents",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to be_an(Array)
        expect(json_response.length).to eq(2)

        first_doc = json_response.first
        expect(first_doc).to have_key("npi")
        expect(first_doc).to have_key("title")
        expect(first_doc).to have_key("created_at")
        expect(first_doc).to have_key("updated_at")
      end
    end

    context "with invalid API token" do
      it "returns unauthorized" do
        get "/api/v1/spaces/#{is_default_space.npi}/documents",
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

        allow(BlocknoteConverterService).to receive(:to_blocks).and_return(sample_blocks)

        get "/api/v1/documents/#{document_one.npi}.json",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response["npi"]).to eq(document_one.npi)
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

        allow(BlocknoteConverterService).to receive(:to_blocks).and_return(sample_blocks)
        allow(BlocknoteConverterService).to receive(:to_markdown).and_return(sample_markdown)

        get "/api/v1/documents/#{document_one.npi}.markdown",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)

        # expect(json_response["npi"]).to eq(document_one.npi)
        # expect(json_response["title"]).to be_present
        expect(response.body).to eq(sample_markdown)
        # expect(json_response["tags"]).to be_an(Array)

        # Verify to_markdown was called with the blocks
        expect(BlocknoteConverterService).to have_received(:to_markdown).with(sample_blocks)
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
        allow(BlocknoteConverterService).to receive(:to_blocks)

        get "/api/v1/documents/#{document_one.npi}.json",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        # Verify it uses version content, not document.to_blocks
        expect(json_response["content"]).to eq(version.content_blocks)
        expect(BlocknoteConverterService).not_to have_received(:to_blocks)
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
        allow(BlocknoteConverterService).to receive(:to_markdown).and_return(sample_markdown)

        get "/api/v1/documents/#{document_one.npi}.markdown",
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:ok)
        expect(response.body).to eq(sample_markdown)
        expect(BlocknoteConverterService).to have_received(:to_markdown).with(version.content_blocks)
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
        allow(BlocknoteConverterService).to receive(:to_blocks).and_return(sample_blocks)

        get "/api/v1/documents/#{document_one.npi}.json",
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
        get "/api/v1/documents/#{document_one.npi}"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "authorization" do
      let(:other_org) { organizations(:hc) }
      let(:other_org_user) { organization_users(:ou_hc_pawel) }
      let!(:other_org_token) do
        ApiToken.create!(
          organization: other_org,
          organization_user: other_org_user,
          title: "Test API Token for Other Org"
        )
      end

      it "returns not found when accessing document from different organization" do
        get "/api/v1/documents/#{document_one.npi}",
          headers: { "Authorization" => "Bearer #{other_org_token.encrypted_token}" }

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

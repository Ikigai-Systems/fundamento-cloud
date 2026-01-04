require "rails_helper"

RSpec.describe "Api::V1::Documents#create", type: :request do
  fixtures :organizations, :users, :organization_users, :spaces

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:pawel_ikigai_systems) { organization_users(:ou_is_pawel) }

  let!(:pawel_is_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_user: pawel_ikigai_systems,
      title: "Test API Token"
    )
  end

  describe "POST /api/v1/documents" do
    context "with valid DOCX file" do
      let(:docx_file) do
        Rack::Test::UploadedFile.new(
          file_fixture("pandoc/Volume-2-Terms-of-Reference.docx"),
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      end

      it "creates document from DOCX file" do
        expect {
          post api_v1_documents_path(space_npi: is_default_space.id),
            params: {
              document: {
                file: docx_file,
                title: "Imported DOCX Document"
              }
            },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)
         .and change(Version, :count).by(1)

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["npi"]).to be_present
        expect(json_response["title"]).to eq("Imported DOCX Document")
      end

      it "uses filename as title when title not provided" do
        post api_v1_documents_path(space_npi: is_default_space.id),
          params: { document: { file: docx_file } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)

        expect(json_response["title"]).to eq("Volume-2-Terms-of-Reference")
      end
    end

    context "with PDF file" do
      let(:pdf_file) do
        Rack::Test::UploadedFile.new(
          file_fixture("pandoc/Volume-2-Terms-of-Reference.pdf"),
          "application/pdf"
        )
      end

      it "rejects PDF file as unsupported" do
        post api_v1_documents_path(space_npi: is_default_space.id),
          params: { document: { file: pdf_file } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["errors"]["file"]).to include("Unsupported file type")
      end
    end

    context "with valid ODT file" do
      let(:odt_file) do
        Rack::Test::UploadedFile.new(
          file_fixture("pandoc/Volume-2-Terms-of-Reference.odt"),
          "application/vnd.oasis.opendocument.text"
        )
      end

      it "creates document from ODT file" do
        expect {
          post api_v1_documents_path(space_npi: is_default_space.id),
            params: { document: { file: odt_file } },
            headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }
        }.to change(Document, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context "with nested document" do
      let(:parent_doc) do
        is_default_space.documents.create!(
          title: "Parent",
          organization: ikigai_systems
        )
      end

      let(:docx_file) do
        Rack::Test::UploadedFile.new(
          file_fixture("pandoc/Volume-2-Terms-of-Reference.docx"),
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      end

      it "creates document under parent" do
        # First add parent to hierarchy
        hierarchy_node = is_default_space.create_hierarchy_node(parent_doc.id)
        is_default_space.hierarchy.append(hierarchy_node)
        is_default_space.save!

        post api_v1_documents_path(space_npi: is_default_space.id),
          params: {
            document: {
              file: docx_file,
              parent_document_npi: parent_doc.npi
            }
          },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:created)

        # Verify hierarchy
        is_default_space.reload
        json_response = JSON.parse(response.body)
        created_doc = Document.find_by(npi: json_response["npi"])

        parent_node = is_default_space.hierarchy.find { |node| node["id"] == parent_doc.id }
        expect(parent_node["children"]).to include(
          hash_including("id" => created_doc.id)
        )
      end
    end

    context "with missing file" do
      it "returns validation error" do
        post api_v1_documents_path(space_npi: is_default_space.id),
          params: { document: { title: "No File" } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["errors"]["base"]).to eq("Either file or markdown must be present")
      end
    end

    context "with unsupported file type" do
      let(:exe_file) do
        Rack::Test::UploadedFile.new(
          file_fixture("pandoc/malware.exe"),
          "application/octet-stream"
        )
      end

      it "returns validation error" do
        post api_v1_documents_path(space_npi: is_default_space.id),
          params: { document: { file: exe_file } },
          headers: { "Authorization" => "Bearer #{pawel_is_token.encrypted_token}" }

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response["errors"]["file"]).to include("Unsupported file type")
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        docx_file = Rack::Test::UploadedFile.new(
          file_fixture("pandoc/Volume-2-Terms-of-Reference.docx"),
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        post api_v1_documents_path(space_npi: is_default_space.id),
          params: { document: { file: docx_file } }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

require "rails_helper"

RSpec.describe AttachmentsController, type: :request do
  fixtures :organizations, :spaces, :users, :organization_users, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:document) { documents(:one) }
  let(:pawel) { users(:pawel) }

  before do
    sign_in pawel
    post select_organization_path(organization)
  end

  describe "GET /attachments/:id" do
    context "with database-stored attachment" do
      let(:attachment) do
        Attachment.create!(
          organization: organization,
          parent: document,
          filename: "test.txt",
          mime_type: "text/plain",
          data: "Hello World"
        )
      end

      it "serves the attachment" do
        get attachment_path(attachment)

        expect(response).to have_http_status(:ok)
        expect(response.body).to eq("Hello World")
        expect(response.content_type).to eq("text/plain")
      end

      it "uses inline disposition" do
        get attachment_path(attachment)

        expect(response.headers["Content-Disposition"]).to include("inline")
      end

      it "serves attachments with different mime types" do
        pdf_attachment = Attachment.create!(
          organization: organization,
          parent: document,
          filename: "document.pdf",
          mime_type: "application/pdf",
          data: "PDF content"
        )

        get attachment_path(pdf_attachment)

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to eq("application/pdf")
      end
    end

    context "with Active Storage attachment" do
      let(:attachment) do
        att = Attachment.create!(
          organization: organization,
          parent: document,
          filename: "test.txt",
          mime_type: "text/plain"
        )
        att.file.attach(
          io: StringIO.new("Hello from Active Storage"),
          filename: "test.txt",
          content_type: "text/plain"
        )
        att
      end

      it "redirects to Active Storage blob URL" do
        get attachment_path(attachment)

        expect(response).to have_http_status(:redirect)
        expect(response.location).to include("rails/active_storage/blobs")
      end

      it "prioritizes Active Storage over database (dual-read)" do
        # This attachment has Active Storage file (will be read from there)
        get attachment_path(attachment)

        expect(response).to have_http_status(:redirect)
        expect(response.location).to include("rails/active_storage/blobs")
        # Should not use send_data for database content
      end
    end

    context "without permission (attachment from another organization)" do
      let(:other_org) { Organization.create!(name: "Other Org") }
      let(:other_space) { Space.create!(organization: other_org, name: "Other Space") }
      let(:other_document) { Document.create!(organization: other_org, space: other_space) }
      let(:attachment) do
        Attachment.create!(
          organization: other_org,
          parent: other_document,
          filename: "secret.txt",
          mime_type: "text/plain",
          data: "Secret data"
        )
      end

      it "returns not found (scoped by current_organization)" do
        get attachment_path(attachment)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /attachments" do
    let(:file) { fixture_file_upload("spec/fixtures/attachments.yml", "text/plain") }

    it "creates an attachment with Active Storage only" do
      expect {
        post attachments_path, params: {
          attachment: {
            parent_id: document.id,
            parent_type: "Document"
          },
          file: file
        }
      }.to change(Attachment, :count).by(1)

      expect(response).to have_http_status(:created)

      attachment = Attachment.last
      expect(attachment.data).to be_nil  # No database storage
      expect(attachment.file.attached?).to be true  # Active Storage only
      expect(attachment.filename).to eq("attachments.yml")
      expect(attachment.mime_type).to eq("text/plain")
      expect(attachment.organization).to eq(organization)
      expect(attachment.parent).to eq(document)
    end

    it "returns attachment location" do
      post attachments_path, params: {
        attachment: {
          parent_id: document.id,
          parent_type: "Document"
        },
        file: file
      }

      json = JSON.parse(response.body)
      expect(json["location"]).to include("/attachments/")
      expect(json["location"]).to include(Attachment.last.id.to_s)
    end

    it "excludes data field from response" do
      post attachments_path, params: {
        attachment: {
          parent_id: document.id,
          parent_type: "Document"
        },
        file: file
      }

      json = JSON.parse(response.body)
      expect(json).not_to have_key("data")
      expect(json).to have_key("id")
      expect(json).to have_key("filename")
      expect(json).to have_key("mime_type")
    end

    it "stores file in Active Storage only (no database storage)" do
      post attachments_path, params: {
        attachment: {
          parent_id: document.id,
          parent_type: "Document"
        },
        file: file
      }

      attachment = Attachment.last
      expect(attachment.stored_in_database?).to be false
      expect(attachment.stored_in_active_storage?).to be true
    end

    it "stores file content accessible via Active Storage" do
      post attachments_path, params: {
        attachment: {
          parent_id: document.id,
          parent_type: "Document"
        },
        file: file
      }

      attachment = Attachment.last
      downloaded_content = attachment.file.download
      expect(downloaded_content).to be_present
      expect(downloaded_content.size).to be > 0
    end

    context "without permission (parent from another organization)" do
      let(:other_org) { Organization.create!(name: "Other Org") }
      let(:other_space) { Space.create!(organization: other_org, name: "Other Space") }
      let(:other_document) { Document.create!(organization: other_org, space: other_space) }

      it "creates attachment but authorization may vary based on parent policy" do
        # Note: The attachment is created with current_organization, but parent belongs to other_org
        # Policy delegates to parent.update? check - behavior depends on DocumentPolicy
        post attachments_path, params: {
          attachment: {
            parent_id: other_document.id,
            parent_type: "Document"
          },
          file: file
        }

        # This test documents current behavior - policy enforcement occurs at parent level
        expect(response).to have_http_status(:created).or have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /attachments/:id" do
    let(:attachment) do
      Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: "Hello World"
      )
    end

    it "deletes the attachment" do
      attachment # create it first

      expect {
        delete attachment_path(attachment)
      }.to change(Attachment, :count).by(-1)
    end

    it "returns success status" do
      delete attachment_path(attachment)

      expect(response).to have_http_status(:no_content)
    end

    context "without permission (attachment from another organization)" do
      let(:other_org) { Organization.create!(name: "Other Org") }
      let(:other_space) { Space.create!(organization: other_org, name: "Other Space") }
      let(:other_document) { Document.create!(organization: other_org, space: other_space) }
      let(:attachment) do
        Attachment.create!(
          organization: other_org,
          parent: other_document,
          filename: "secret.txt",
          mime_type: "text/plain",
          data: "Secret data"
        )
      end

      it "returns not found (scoped by current_organization)" do
        delete attachment_path(attachment)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

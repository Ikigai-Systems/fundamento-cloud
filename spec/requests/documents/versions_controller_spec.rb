require "rails_helper"

RSpec.describe Documents::VersionsController, type: :request do
  fixtures :organizations, :users, :organization_memberships,
           :spaces, :documents, :document_editing_sessions

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:document) { documents(:two) }

  before do
    sign_in pawel
    post select_organization_path(ikigai_systems)
  end

  describe "POST /d/:document_id/versions" do
    let(:content_blocks) do
      [{ "id" => "block1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Hello" }] }].to_json
    end

    it "claims unlinked editing sessions for the document" do
      session1 = DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_pawel),
        connected_at: 1.hour.ago,
        disconnected_at: 30.minutes.ago,
        edited: true
      )
      session2 = DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_stefan),
        connected_at: 1.hour.ago,
        disconnected_at: 30.minutes.ago,
        edited: false
      )

      post document_versions_path(document), params: { content_blocks: content_blocks }

      version = document.versions.order(created_at: :desc).first

      session1.reload
      session2.reload
      expect(session1.version).to eq(version)
      expect(session2.version).to eq(version)
    end

    it "does not claim sessions already linked to a previous version" do
      previous_version = document.versions.create!(
        content_blocks: [],
        created_by: pawel
      )
      already_linked = DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_pawel),
        connected_at: 2.hours.ago,
        disconnected_at: 1.hour.ago,
        edited: true,
        version: previous_version
      )

      post document_versions_path(document), params: { content_blocks: content_blocks }

      already_linked.reload
      expect(already_linked.version).to eq(previous_version)
    end

    it "does not claim sessions from other documents" do
      other_doc_session = document_editing_sessions(:session_pawel_doc_one)

      post document_versions_path(document), params: { content_blocks: content_blocks }

      other_doc_session.reload
      expect(other_doc_session.version_id).to be_nil
    end

    it "allows querying editors vs present members on the version" do
      # Link the pre-existing fixture session to a previous version so it won't be claimed
      previous_version = document.versions.create!(content_blocks: [], created_by: pawel)
      document_editing_sessions(:session_pawel_doc_two).update!(version: previous_version)

      DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_pawel),
        connected_at: 1.hour.ago,
        edited: true
      )
      DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_stefan),
        connected_at: 1.hour.ago,
        edited: false
      )

      post document_versions_path(document), params: { content_blocks: content_blocks }

      version = document.versions.order(created_at: :desc).first
      expect(version.editing_sessions.count).to eq(2)
      expect(version.editor_sessions.count).to eq(1)
      expect(version.editor_sessions.first.member).to eq(organization_memberships(:om_is_pawel))
    end
  end

  describe "GET /d/:document_id/versions (history list)" do
    before do
      document.versions.create!(content_blocks: [], created_by: pawel)
    end

    it "renders full layout including left sidebar and content frame on direct access" do
      get document_versions_path(document)

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('id="space-sidebar"')
      expect(response.body).to include('id="content"')
    end

    it "renders the frame-only layout when Turbo-Frame: content header is present" do
      get document_versions_path(document),
        headers: { "Turbo-Frame" => "content" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('id="content"')
      expect(response.body).not_to include('id="space-sidebar"')
    end
  end
end

require "rails_helper"

RSpec.describe DocumentChannel, type: :channel do
  fixtures :organizations, :users, :organization_memberships,
           :spaces, :space_memberships, :documents

  let(:user) { organization_membership.user }
  let(:organization) { organization_membership.organization }

  before do
    stub_connection(
      current_user: user,
      current_organization: organization,
      pundit_user: PolicyUserContext.new(user, organization)
    )
  end

  describe "#subscribed" do
    context "when the document belongs to a public space" do
      let(:organization_membership) { organization_memberships(:om_is_stefan) }
      let(:document) { documents(:one) } # is_default space, public

      it "confirms the subscription" do
        subscribe(documentId: document.id)

        expect(subscription).to be_confirmed
      end

      it "streams from the document channel" do
        subscribe(documentId: document.id)

        expect(subscription).to have_stream_from("document/#{document.id}")
      end
    end

    context "when the document belongs to a private space the user has access to" do
      let(:organization_membership) { organization_memberships(:om_is_stefan) }
      let(:document) do
        Document.create!(
          organization: organizations(:is),
          space: spaces(:is_stefans),
          title: "Stefan's doc"
        )
      end

      it "confirms the subscription" do
        subscribe(documentId: document.id)

        expect(subscription).to be_confirmed
      end
    end

    context "when the document belongs to a private space the user does not have access to" do
      let(:organization_membership) { organization_memberships(:om_hc_stefan) }
      let(:document) do
        Document.create!(
          organization: organizations(:hc),
          space: spaces(:hc_pawels),
          title: "Pawel's private doc"
        )
      end

      it "rejects the subscription" do
        subscribe(documentId: document.id)

        expect(subscription).to be_rejected
      end
    end

    context "when the document belongs to a different organization" do
      let(:organization_membership) { organization_memberships(:om_hc_stefan) }
      let(:document) { documents(:one) } # belongs to org "is"

      it "rejects the subscription" do
        subscribe(documentId: document.id)

        expect(subscription).to be_rejected
      end
    end

    context "when the document does not exist" do
      let(:organization_membership) { organization_memberships(:om_is_pawel) }

      it "rejects the subscription" do
        subscribe(documentId: "nonexistent")

        expect(subscription).to be_rejected
      end
    end
  end

  describe "editing session tracking" do
    fixtures :document_editing_sessions

    let(:organization_membership) { organization_memberships(:om_is_pawel) }
    let(:document) { documents(:one) }

    context "on subscribe" do
      it "creates a DocumentEditingSession" do
        expect {
          subscribe(documentId: document.id)
        }.to change(DocumentEditingSession, :count).by(1)
      end

      it "sets connected_at and links to the correct member" do
        subscribe(documentId: document.id)

        session = DocumentEditingSession.order(created_at: :desc).first
        expect(session.document).to eq(document)
        expect(session.member).to eq(organization_membership)
        expect(session.connected_at).to be_present
        expect(session.edited).to be(false)
        expect(session.version_id).to be_nil
      end

      it "does not create a session when subscription is rejected" do
        expect {
          subscribe(documentId: "nonexistent")
        }.not_to change(DocumentEditingSession, :count)
      end
    end

    context "on receive" do
      before do
        subscribe(documentId: document.id)
        allow(subscription).to receive(:sync)
      end

      it "marks the session as edited on first receive" do
        session = DocumentEditingSession.order(created_at: :desc).first
        expect(session.edited).to be(false)

        perform(:receive, { "update" => "data" })

        session.reload
        expect(session.edited).to be(true)
      end

      it "does not perform extra DB writes on subsequent receives" do
        perform(:receive, { "update" => "data1" })

        session = DocumentEditingSession.order(created_at: :desc).first
        expect {
          perform(:receive, { "update" => "data2" })
        }.not_to change { session.reload.updated_at }
      end
    end

    context "on unsubscribe" do
      it "sets disconnected_at on the session" do
        subscribe(documentId: document.id)
        session = DocumentEditingSession.order(created_at: :desc).first
        expect(session.disconnected_at).to be_nil

        subscription.unsubscribe_from_channel

        session.reload
        expect(session.disconnected_at).to be_present
      end
    end
  end
end

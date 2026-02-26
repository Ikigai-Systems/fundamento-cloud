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
end

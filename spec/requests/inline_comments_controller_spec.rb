require "rails_helper"

RSpec.describe "InlineComments", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  # Threads are looked up by id. Knowing one from another organization must not let a user
  # change it. Maria belongs only to "hc"; document "one" lives in "is".
  context "with a thread in another organization" do
    let!(:thread) { InlineCommentThread.create!(id: "foreign_thread", document: documents(:one)) }

    before do
      sign_in users(:maria)
      post select_organization_path(organizations(:hc))
    end

    it "can't be resolved" do
      post "/inline_comments/threads/#{thread.id}/resolve"

      expect(thread.reload.resolved_at).to be_nil
    end

    it "can't be deleted" do
      delete "/inline_comments/threads/#{thread.id}"

      expect(InlineCommentThread.exists?(thread.id)).to be(true)
    end
  end
end

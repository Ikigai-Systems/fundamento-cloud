require "rails_helper"

RSpec.describe "Reddit PAGE_VISIT on first space home visit", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents, :versions

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:home_doc) { documents(:two) } # has a version so show won't redirect

  before do
    sign_in user
    post select_organization_path(organization)
    space.update!(home_document: home_doc)
    user.update_column(:reddit_click_id, "rdt_abc123")
    allow(RedditConversionService).to receive(:enabled?).and_return(true)
  end

  it "enqueues PAGE_VISIT when user first visits a space home document" do
    # Ensure no prior visit exists
    ObjectVisitor.where(user: user, object: home_doc).delete_all

    expect {
      get document_path(home_doc, format: :json)
    }.to have_enqueued_job(RedditConversionJob).with(
      event_type: "PageVisit",
      user: user,
      ip_address: anything,
      user_agent: anything
    )
  end

  it "does not enqueue PAGE_VISIT on subsequent visits" do
    # Create a prior visit
    user.visit_object(home_doc)

    expect {
      get document_path(home_doc, format: :json)
    }.not_to have_enqueued_job(RedditConversionJob)
  end

  it "does not enqueue PAGE_VISIT for non-home documents" do
    regular_doc = documents(:one)

    expect {
      get document_path(regular_doc, format: :json)
    }.not_to have_enqueued_job(RedditConversionJob)
  end

  it "does not enqueue PAGE_VISIT for users without reddit_click_id" do
    user.update_column(:reddit_click_id, nil)
    ObjectVisitor.where(user: user, object: home_doc).delete_all

    expect {
      get document_path(home_doc, format: :json)
    }.not_to have_enqueued_job(RedditConversionJob)
  end
end

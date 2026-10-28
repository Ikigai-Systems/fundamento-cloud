require "rails_helper"

# The bell is a lazy Turbo frame in every layout, so this endpoint is rendered on
# every page view in the app. Nothing covered it before.
RSpec.describe "GET /notifications", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_references

  let(:organization) { organizations(:is) }
  let(:user) { users(:stefan) }
  let(:membership) { organization_memberships(:om_is_stefan) }

  before do
    sign_in user
    post select_organization_path(organization)
  end

  def badge_count
    response.body[/data-count="(\d+)"/, 1]&.to_i
  end

  def mark_seen_at(time)
    membership.organization_membership_properties.create!(
      key: "last_mention_seen_at",
      value: time.iso8601
    )
  end

  it "renders the bell" do
    get notifications_path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('data-testid="notifications-button"')
  end

  it "badges the user's unread mentions" do
    get notifications_path

    expect(badge_count).to eq(ObjectReference.where(target_type: "User", target_id: user.id).count)
  end

  it "counts only mentions newer than the last one the user saw" do
    mark_seen_at(4.days.ago)

    get notifications_path

    # non_current_user_mention is 5 days old, the other two are newer
    expect(badge_count).to eq(2)
  end

  it "drops the badge once every mention has been seen" do
    mark_seen_at(1.minute.from_now)

    get notifications_path

    expect(badge_count).to be_nil
    expect(response.body).to include("No unread notifications")
  end

  it "does not count mentions of other users" do
    ObjectReference.create!(
      source_node_id: "someone-else",
      source: documents(:one),
      target_type: "User",
      target_id: users(:pawel).id,
      title: "Pawel",
      current: true,
      organization: organization
    )

    get notifications_path

    expect(badge_count).to eq(3)
  end
end

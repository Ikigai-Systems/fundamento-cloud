require "rails_helper"

RSpec.describe "ImportSessions", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships

  let(:org) { organizations(:hc) }
  let(:maria) { organization_memberships(:om_hc_maria) }

  # Pawel's import into his private space, which Maria cannot open.
  let!(:private_import) do
    session = ImportSession.create!(
      organization: org,
      space: spaces(:hc_pawels),
      organization_membership: organization_memberships(:om_hc_pawel)
    )
    session.import_files.create!(relative_path: "HR/salaries.pdf", file_type: :attachment, format: "pdf")
    session
  end

  before do
    sign_in maria.user
    post select_organization_path(org)
  end

  it "does not list another member's import" do
    get import_sessions_path

    expect(response).to have_http_status(:ok)
    expect(response.body).not_to include(import_session_path(private_import))
  end

  it "does not show another member's import" do
    get import_session_path(private_import)

    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("salaries.pdf")
  end

  it "lists and shows the member's own import" do
    own = ImportSession.create!(organization: org, space: spaces(:hc_default), organization_membership: maria)

    get import_sessions_path
    expect(response.body).to include(import_session_path(own))

    get import_session_path(own)
    expect(response).to have_http_status(:ok)
  end
end

require "rails_helper"

# Document#nullify_object_reference_targets used to clear a reference's target when the
# document was destroyed. Trashing skips every destroy callback, on purpose -- the target
# has to survive so untrashing makes the connection work again -- which means this
# component is now the thing that has to cope with a target it cannot see.
#
# Before, it loaded the target with `find_by_param!` and would raise, taking the whole
# sidebar tab down for a document that merely mentions something deleted.
RSpec.describe SidebarConnectionsTab, type: :component do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:user) { users(:pawel) }
  let(:pundit_user) { PolicyUserContext.new(organization_memberships(:om_is_pawel)) }
  let(:source) { documents(:one) }
  let(:target) { documents(:two) }

  before do
    ObjectReference.create!(
      organization: organization,
      source: source,
      target_type: "Document",
      target_id: target.id,
      title: target.title,
      current: true,
    )
  end

  it "renders without the connection when its target is trashed" do
    target.trash!(by: user)

    expect {
      render_inline(described_class.new(object: source, pundit_user: pundit_user))
    }.not_to raise_error

    expect(rendered_content).not_to include(target.title)
  end

  it "still renders a connection whose target is kept" do
    render_inline(described_class.new(object: source, pundit_user: pundit_user))

    expect(rendered_content).to include(target.title)
  end
end

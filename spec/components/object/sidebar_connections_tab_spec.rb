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

  it "renders data-color on the title of a colored object and none on an uncolored one" do
    target.update!(color: "magenta")
    # The source mentions the target (outgoing) and the target is referenced in the source (incoming).
    ObjectReference.create!(organization: organization, source: target, target_type: "Document", target_id: source.id, title: source.title, current: true)

    render_inline(described_class.new(object: source, pundit_user: pundit_user))
    html = Nokogiri::HTML(rendered_content)

    # Once as "Referenced in" (the target mentions the source), once as "References".
    expect(html.css("a[href='/d/#{target.id}'] [data-color='magenta']").map(&:text)).to eq([target.title, target.title])

    target.update!(color: nil)
    render_inline(described_class.new(object: source, pundit_user: pundit_user))
    expect(Nokogiri::HTML(rendered_content).css("[data-color]")).to be_empty
  end

  it "still renders a connection whose target is kept" do
    render_inline(described_class.new(object: source, pundit_user: pundit_user))

    expect(rendered_content).to include(target.title)
  end
end

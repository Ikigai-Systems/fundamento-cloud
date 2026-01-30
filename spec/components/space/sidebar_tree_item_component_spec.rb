# frozen_string_literal: true

require "rails_helper"

RSpec.describe Space::SidebarTreeItemComponent, type: :component do
  fixtures :organizations, :spaces, :users, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:user) { users(:stefan) }
  let(:document) { documents(:one) }

  def render_item(**options)
    defaults = {
      document: document,
      level: 0,
      has_children: false,
      selected: false,
      space: space
    }

    with_request_url("/") do
      allow_any_instance_of(described_class).to receive(:cookies).and_return({})
      allow_any_instance_of(described_class).to receive(:helpers).and_return(
        double(
          pundit_user: PolicyUserContext.new(user, organization),
          protect_against_forgery?: false
        )
      )

      render_inline(described_class.new(**defaults.merge(options)))
    end
  end

  it "renders link to document" do
    result = render_item
    expect(result.to_html).to include("/d/#{document.id}")
  end

  it "renders document title" do
    result = render_item
    expect(result.to_html).to include(document.title_emojiless || document.title)
  end

  it "applies correct padding at level 0" do
    result = render_item(level: 0)
    expect(result.to_html).to include('--level: 0')
  end

  it "applies correct padding at level 2" do
    result = render_item(level: 2)
    expect(result.to_html).to include('--level: 2')
  end

  it "applies selected class when selected" do
    result = render_item(selected: true)
    expect(result.to_html).to match(/content-link-container[^>]*selected/)
  end

  it "shows plus button for creating child" do
    result = render_item
    expect(result.to_html).to include('fa-plus')
  end

  it "shows edit button" do
    result = render_item
    expect(result.to_html).to include('fa-pencil')
  end
end

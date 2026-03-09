# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserAvatarsGroup, type: :component do
  fixtures :organizations, :users

  let(:organization) { organizations(:is) }

  describe "rendering" do
    it "renders nothing when users list is empty" do
      result = render_inline(described_class.new(users: User.none, organization: organization))
      expect(result.to_html.strip).to eq("")
    end

    it "renders avatars for each user when count <= max" do
      users = User.where(id: ["user_pawel", "user_stefan"])
      result = render_inline(described_class.new(users: users, organization: organization))

      expect(result.css("[data-testid='user-avatars-group']")).to be_present
      expect(result.css(".avatar").length).to eq(2)
    end

    it "renders overflow counter when users exceed max" do
      # Use max: 2 so we can test overflow with just 3 users
      users = User.where(id: ["user_pawel", "user_stefan", "user_maria"])
      result = render_inline(described_class.new(users: users, organization: organization, max: 2))

      # Should show 1 avatar directly (not inside template) + overflow counter showing +2
      visible_avatars = result.css("[data-testid='user-avatars-group'] > div > .avatar")
      expect(visible_avatars.length).to eq(1)
      expect(result.text).to include("+2")
    end

    it "uses descending z-index for stacking" do
      users = User.where(id: ["user_pawel", "user_stefan"])
      result = render_inline(described_class.new(users: users, organization: organization))

      avatars = result.css("[data-testid='user-avatars-group'] > *")
      classes = avatars.map { |a| a["class"] }

      expect(classes.first).to include("z-30")
      expect(classes.last).to include("z-20")
    end

    it "includes popover with remaining users in overflow" do
      users = User.where(id: ["user_pawel", "user_stefan", "user_maria"])
      result = render_inline(described_class.new(users: users, organization: organization, max: 2))

      popover_template = result.css("template[data-popover-target='content']")
      expect(popover_template).to be_present
    end
  end
end

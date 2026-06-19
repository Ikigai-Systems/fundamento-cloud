require "rails_helper"

RSpec.describe Favorite, type: :model do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :favorites

  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:space) { spaces(:is_default) }
  # Use documents(:two) — documents(:one) is already favorited by is_favorite_1 fixture
  # and the uniqueness constraint would prevent creating another favorite for it.
  let(:document) { documents(:two) }

  describe "space channel broadcasting" do
    it "broadcasts prepend to space channel when a space-owned object is starred" do
      # The existing broadcasts_to macro also calls broadcast_prepend_to for the
      # root [membership, :favorites] channel — allow that call so it doesn't interfere.
      allow(Turbo::StreamsChannel).to receive(:broadcast_prepend_to)
      expect(Turbo::StreamsChannel).to receive(:broadcast_prepend_to)
        .with(
          [membership, space, :favorites],
          hash_including(target: "space_starred_list")
        )

      membership.favorites.create!(object: document)
    end

    it "broadcasts remove to space channel when a space-owned favorite is destroyed" do
      favorite = membership.favorites.create!(object: document)

      # Allow the root channel remove (from broadcasts_to) without it failing the test.
      allow(Turbo::StreamsChannel).to receive(:broadcast_remove_to)
      expect(Turbo::StreamsChannel).to receive(:broadcast_remove_to)
        .with(
          [membership, space, :favorites],
          hash_including(target: favorite)
        )

      favorite.destroy!
    end

    it "does not broadcast to space channel when object has no space" do
      # Stub space on ALL Document instances — after_commit loads the association fresh
      # from the DB so we must stub at the class level, not just on the local variable.
      allow_any_instance_of(Document).to receive(:space).and_return(nil)
      # Allow the root channel call from the existing broadcasts_to macro so it
      # doesn't raise. Use spy-style assertion after the fact to avoid allow/not_to
      # receive precedence conflicts.
      allow(Turbo::StreamsChannel).to receive(:broadcast_prepend_to)

      membership.favorites.create!(object: document)

      expect(Turbo::StreamsChannel).not_to have_received(:broadcast_prepend_to)
        .with([membership, instance_of(Space), :favorites], anything)
    end
  end
end

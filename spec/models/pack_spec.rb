require 'rails_helper'

RSpec.describe Pack, type: :model do
  fixtures :organizations
  fixtures :packs

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      pack = packs(:test_pack_1)
      expect(pack.id).to be_a(String)
      expect(pack.id.length).to be >= 10
    end

    it "has string pack_id in pack_versions" do
      organization = organizations(:is)

      pack = Pack.create!(
        id: "testpack01",
        name: "Test Pack",
        organization: organization
      )

      version = pack.versions.create!(
        organization: organization
      )

      expect(version.pack_id).to be_a(String)
      expect(version.pack_id).to eq(pack.id)
      expect(version.pack_id).to eq("testpack01")
    end
  end

  it 'should save with valid attributes' do
    pack = packs(:test_pack_1)
    expect(pack.save).to be_truthy
  end

  it 'should not save without a name' do
    pack = packs(:test_pack_1)
    pack.name = nil
    expect(pack.save).to be_falsey
  end

  it 'should not save without an organization' do
    pack = packs(:test_pack_1)
    pack.organization = nil
    expect(pack.save).to be_falsey
  end

  # packs.active_version_id is a foreign key into pack_versions, and a pack destroys its versions
  # before deleting itself -- so with an active version set, the delete was refused and the pack
  # could not be destroyed, nor could the organization holding it.
  describe "destroying a pack with an active version" do
    fixtures :pack_versions

    let(:pack) { packs(:test_pack_1) }

    before { pack.update!(active_version: pack_versions(:is_one_v2)) }

    it "removes the pack and its versions" do
      pack.destroy!

      expect(Pack.exists?(pack.id)).to be(false)
      expect(PackVersion.where(pack_id: pack.id)).to be_empty
    end

    it "does not stop its organization being destroyed" do
      expect { organizations(:is).destroy! }.not_to raise_error
    end
  end
end

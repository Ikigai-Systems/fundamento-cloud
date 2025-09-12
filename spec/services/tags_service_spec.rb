require "rails_helper"

RSpec.describe TagsService, type: :model do
  fixtures :organizations, :users, :organization_users, :spaces, :space_memberships, :documents

  let(:user) { users(:pawel) }
  let(:document) { documents(:one) }
  let(:organization) { document.organization }
  let(:space) { document.space }

  let(:service) { TagsService.new(object: document, organization: organization) }

  describe "initialization" do
    it "creates a valid service with document and organization" do
      expect(service).to be_valid
      expect(service.object).to eq(document)
      expect(service.organization).to eq(organization)
    end

    it "raises error for unsupported object type" do
      invalid_object = double("InvalidObject", class: double(name: "InvalidType"))

      service = TagsService.new(object: invalid_object, organization: organization)
      expect(service).not_to be_valid
      expect(service.errors[:object]).to include("unsupported object type: InvalidType. Allowed types: Document, Table")
    end

    it "is invalid without object" do
      service = TagsService.new(object: nil, organization: organization)
      expect(service).not_to be_valid
      expect(service.errors[:object]).to include("can't be blank")
    end

    it "is invalid without organization" do
      service = TagsService.new(object: document, organization: nil)
      expect(service).not_to be_valid
      expect(service.errors[:organization]).to include("can't be blank")
    end
  end

  describe "#add_tags" do
    it "adds new tags with # prefix" do
      expect {
        added_tags = service.add_tags(["#business", "#marketing"])
        expect(added_tags.length).to eq(2)
        expect(added_tags.map(&:name)).to contain_exactly("business", "marketing")
      }.to change(Tag, :count).by(2)
        .and change(ObjectTag, :count).by(2)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("business", "marketing")
    end

    it "adds tags without # prefix" do
      added_tags = service.add_tags(["project", "urgent"])
      expect(added_tags.map(&:name)).to contain_exactly("project", "urgent")

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("project", "urgent")
    end

    it "normalizes tag names to lowercase" do
      added_tags = service.add_tags(["#BUSINESS", "#Marketing", "#BUSINESS/Strategy"])
      expect(added_tags.map(&:name)).to contain_exactly("business", "marketing", "business/strategy")

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("business", "marketing", "business/strategy")
    end

    it "doesn't create duplicate ObjectTag associations" do
      # First, add a tag
      existing_tag = Tag.create!(name: "existing", space: space, organization: organization)
      ObjectTag.create!(tag: existing_tag, object: document, organization: organization)

      expect {
        service.add_tags(["#existing", "#new"])
      }.to change(ObjectTag, :count).by(1) # Only the new tag should create an ObjectTag

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("existing", "new")
    end

    it "reuses existing tags in the same space" do
      existing_tag = Tag.create!(name: "reusable", space: space, organization: organization)

      expect {
        service.add_tags(["#reusable", "#new"])
      }.to change(Tag, :count).by(1) # Only the new tag should be created

      document.reload
      expect(document.tags).to include(existing_tag)
    end

    it "skips blank tag names" do
      expect {
        service.add_tags(["#valid", "", "#", "#another_valid"])
      }.to change(Tag, :count).by(2)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("valid", "another_valid")
    end

    it "validates tag format and raises error for invalid tags" do
      expect {
        service.add_tags(["#valid", "#invalid@tag"])
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "rolls back transaction on validation error" do
      expect {
        expect {
          expect {
            service.add_tags(["#good", "#bad@tag"])
          }.to raise_error(ActiveRecord::RecordInvalid)
        }.to_not change(Tag, :count)
      }.to_not change(ObjectTag, :count)
    end

    it "raises error if service is invalid" do
      invalid_service = TagsService.new(object: nil, organization: organization)

      expect {
        invalid_service.add_tags(["#test"])
      }.to raise_error(ActiveModel::ValidationError)
    end
  end

  describe "#remove_tags" do
    before do
      @tag1 = Tag.create!(name: "business", space: space, organization: organization)
      @tag2 = Tag.create!(name: "marketing", space: space, organization: organization)
      @tag3 = Tag.create!(name: "strategy", space: space, organization: organization)

      ObjectTag.create!(tag: @tag1, object: document, organization: organization)
      ObjectTag.create!(tag: @tag2, object: document, organization: organization)
      ObjectTag.create!(tag: @tag3, object: document, organization: organization)
    end

    it "removes specified tags with # prefix" do
      removed_count = service.remove_tags(["#business", "#marketing"])
      expect(removed_count).to eq(2)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("strategy")
    end

    it "removes tags without # prefix" do
      removed_count = service.remove_tags(["business", "strategy"])
      expect(removed_count).to eq(2)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("marketing")
    end

    it "handles case-insensitive tag removal" do
      removed_count = service.remove_tags(["#BUSINESS", "#Marketing"])
      expect(removed_count).to eq(2)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("strategy")
    end

    it "keeps tags in database after removal from object" do
      expect {
        expect {
          service.remove_tags(["#business", "#marketing"])
        }.to change(ObjectTag, :count).by(-2)
      }.to_not change(Tag, :count)

      # Verify tags still exist in database
      expect(Tag.find_by(name: "business", space: space)).to be_present
      expect(Tag.find_by(name: "marketing", space: space)).to be_present
    end

    it "gracefully handles removing non-existent tags" do
      removed_count = service.remove_tags(["#business", "#nonexistent", "#marketing"])
      expect(removed_count).to eq(2)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("strategy")
    end

    it "gracefully handles removing tags not associated with object" do
      unassociated_tag = Tag.create!(name: "unassociated", space: space, organization: organization)

      removed_count = service.remove_tags(["#business", "#unassociated"])
      expect(removed_count).to eq(1)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("marketing", "strategy")
    end

    it "handles removing from object with no existing tags" do
      document.object_tags.destroy_all

      removed_count = service.remove_tags(["#nonexistent"])
      expect(removed_count).to eq(0)

      document.reload
      expect(document.tags).to be_empty
    end

    it "skips blank tag names" do
      removed_count = service.remove_tags(["#business", "", "#"])
      expect(removed_count).to eq(1)

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("marketing", "strategy")
    end
  end

  describe "#update_tags" do
    before do
      @existing_tag1 = Tag.create!(name: "old1", space: space, organization: organization)
      @existing_tag2 = Tag.create!(name: "old2", space: space, organization: organization)

      ObjectTag.create!(tag: @existing_tag1, object: document, organization: organization)
      ObjectTag.create!(tag: @existing_tag2, object: document, organization: organization)
    end

    it "replaces all existing tags with new ones" do
      new_tags = service.update_tags(["#new1", "#new2", "#new3"])
      expect(new_tags.map(&:name)).to contain_exactly("new1", "new2", "new3")

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("new1", "new2", "new3")
    end

    it "creates new tags if they don't exist" do
      expect {
        service.update_tags(["#brand_new", "#another_new"])
      }.to change(Tag, :count).by(2)

      expect(Tag.find_by(name: "brand_new", space: space)).to be_present
      expect(Tag.find_by(name: "another_new", space: space)).to be_present
    end

    it "reuses existing tags when possible" do
      existing_tag = Tag.create!(name: "reusable", space: space, organization: organization)

      expect {
        new_tags = service.update_tags(["#reusable", "#new_tag"])
        expect(new_tags).to include(existing_tag)
      }.to change(Tag, :count).by(1) # Only the new tag should be created

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("reusable", "new_tag")
    end

    it "removes all tags when empty array is provided" do
      new_tags = service.update_tags([])
      expect(new_tags).to be_empty

      document.reload
      expect(document.tags).to be_empty
    end

    it "keeps old tags in database after removal from object" do
      original_tag_count = Tag.count

      service.update_tags(["#completely_different"])

      expect(Tag.count).to eq(original_tag_count + 1)
      expect(@existing_tag1.reload).to be_present
      expect(@existing_tag2.reload).to be_present
    end

    it "normalizes tags without # prefix" do
      new_tags = service.update_tags(["business", "marketing"])
      expect(new_tags.map(&:name)).to contain_exactly("business", "marketing")
    end

    it "normalizes tag names to lowercase" do
      new_tags = service.update_tags(["#BUSINESS", "#Marketing", "#BUSINESS/Strategy"])
      expect(new_tags.map(&:name)).to contain_exactly("business", "marketing", "business/strategy")

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("business", "marketing", "business/strategy")
    end

    it "skips empty tag names" do
      new_tags = service.update_tags(["#valid", "", "#", "#another_valid"])
      expect(new_tags.map(&:name)).to contain_exactly("valid", "another_valid")

      document.reload
      expect(document.tags.pluck(:name)).to contain_exactly("valid", "another_valid")
    end

    it "validates tag format and raises error for invalid tags" do
      expect {
        service.update_tags(["#valid", "#invalid@tag"])
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "rolls back all changes if any tag validation fails" do
      original_object_tag_count = ObjectTag.where(object: document).count
      original_tag_count = Tag.count

      expect {
        expect {
          service.update_tags(["#good", "#bad@tag"])
        }.to raise_error(ActiveRecord::RecordInvalid)
      }.to_not change(Tag, :count)

      # Should still have the original ObjectTag associations
      expect(ObjectTag.where(object: document).count).to eq(original_object_tag_count)

      document.reload
      expect(document.tags).to contain_exactly(@existing_tag1, @existing_tag2)
    end
  end

  describe "#current_tags" do
    before do
      @tag1 = Tag.create!(name: "current1", space: space, organization: organization)
      @tag2 = Tag.create!(name: "current2", space: space, organization: organization)

      ObjectTag.create!(tag: @tag1, object: document, organization: organization)
      ObjectTag.create!(tag: @tag2, object: document, organization: organization)
    end

    it "returns all tags associated with the object" do
      current_tags = service.current_tags
      expect(current_tags).to contain_exactly(@tag1, @tag2)
    end

    it "returns empty array for object with no tags" do
      document.object_tags.destroy_all

      current_tags = service.current_tags
      expect(current_tags).to be_empty
    end
  end

  describe "#current_tags_with_prefix" do
    before do
      @tag1 = Tag.create!(name: "display1", space: space, organization: organization)
      @tag2 = Tag.create!(name: "display2", space: space, organization: organization)

      ObjectTag.create!(tag: @tag1, object: document, organization: organization)
      ObjectTag.create!(tag: @tag2, object: document, organization: organization)
    end

    it "returns tag names with # prefix" do
      tags_with_prefix = service.current_tags_with_prefix
      expect(tags_with_prefix).to contain_exactly("#display1", "#display2")
    end

    it "returns empty array for object with no tags" do
      document.object_tags.destroy_all

      tags_with_prefix = service.current_tags_with_prefix
      expect(tags_with_prefix).to be_empty
    end
  end

  describe ".normalize_tag_name" do
    it "strips # prefix and normalizes to lowercase" do
      expect(TagsService.normalize_tag_name("#BUSINESS")).to eq("business")
      expect(TagsService.normalize_tag_name("#Marketing")).to eq("marketing")
      expect(TagsService.normalize_tag_name("#BUSINESS/Strategy")).to eq("business/strategy")
    end

    it "handles tags without # prefix" do
      expect(TagsService.normalize_tag_name("business")).to eq("business")
      expect(TagsService.normalize_tag_name("Marketing")).to eq("marketing")
    end

    it "strips whitespace" do
      expect(TagsService.normalize_tag_name("  #business  ")).to eq("business")
      expect(TagsService.normalize_tag_name("  marketing  ")).to eq("marketing")
    end

    it "handles blank values" do
      expect(TagsService.normalize_tag_name("")).to eq("")
      expect(TagsService.normalize_tag_name(nil)).to eq("")
      expect(TagsService.normalize_tag_name("   ")).to eq("")
    end

    it "handles Polish characters" do
      expect(TagsService.normalize_tag_name("#Zarządzanie")).to eq("zarządzanie")
      expect(TagsService.normalize_tag_name("#ĆŚĄĘŻ")).to eq("ćśąęż")
    end
  end

  describe ".valid_tag_name?" do
    it "validates correct tag names" do
      expect(TagsService.valid_tag_name?("#business")).to be true
      expect(TagsService.valid_tag_name?("business")).to be true
      expect(TagsService.valid_tag_name?("#business/marketing")).to be true
      expect(TagsService.valid_tag_name?("#business-plan")).to be true
      expect(TagsService.valid_tag_name?("#business_plan")).to be true
      expect(TagsService.valid_tag_name?("#zarządzanie")).to be true
    end

    it "rejects invalid tag names" do
      expect(TagsService.valid_tag_name?("#business@invalid")).to be false
      expect(TagsService.valid_tag_name?("#business&invalid")).to be false
      expect(TagsService.valid_tag_name?("#business%invalid")).to be false
      expect(TagsService.valid_tag_name?("#business invalid")).to be false
      expect(TagsService.valid_tag_name?("")).to be false
      expect(TagsService.valid_tag_name?(nil)).to be false
    end
  end

  context "with tables" do
    fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

    let(:table) { tables_tables(:projects) }
    let(:table_service) { TagsService.new(object: table, organization: organization) }

    it "works with table objects" do
      expect(table_service).to be_valid

      added_tags = table_service.add_tags(["#data", "#analytics"])
      expect(added_tags.map(&:name)).to contain_exactly("data", "analytics")

      table.reload
      expect(table.tags.pluck(:name)).to contain_exactly("data", "analytics")
    end
  end
end
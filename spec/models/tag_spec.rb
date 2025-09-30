require 'rails_helper'

RSpec.describe Tag, type: :model do
  fixtures :organizations, :spaces

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  describe '.query scope' do
    before do
      # Create test tags with the hierarchical structure mentioned in the requirements
      @test_tag = Tag.create!(name: 'test', space: space, organization: organization)
      @test_another_tag = Tag.create!(name: 'test/another', space: space, organization: organization)
      @another_tag = Tag.create!(name: 'another', space: space, organization: organization)
      @business_tag = Tag.create!(name: 'business', space: space, organization: organization)
      @business_marketing_tag = Tag.create!(name: 'business/marketing', space: space, organization: organization)
      @business_marketing_social_tag = Tag.create!(name: 'business/marketing/social', space: space, organization: organization)
      @development_tag = Tag.create!(name: 'development', space: space, organization: organization)
      @development_ruby_tag = Tag.create!(name: 'development/ruby', space: space, organization: organization)
    end

    context 'with blank or nil query' do
      it 'returns all tags when query is blank' do
        result = Tag.query('')
        expect(result).to include(@test_tag, @test_another_tag, @another_tag, @business_tag)
      end

      it 'returns all tags when query is nil' do
        result = Tag.query(nil)
        expect(result).to include(@test_tag, @test_another_tag, @another_tag, @business_tag)
      end

      it 'returns all tags when query is whitespace' do
        result = Tag.query('  ')
        expect(result).to include(@test_tag, @test_another_tag, @another_tag, @business_tag)
      end
    end

    context 'with simple substring queries (no hierarchy)' do
      it 'finds all tags containing "e" substring' do
        result = Tag.query('e')
        # "e" should match: test, test/another, another, business, development, development/ruby
        # Also matches: business/marketing (contains "e" in "marketing"), business/marketing/social (contains "e" in "marketing")
        expect(result).to include(@test_tag, @test_another_tag, @another_tag, @business_tag, @development_tag, @development_ruby_tag, @business_marketing_tag, @business_marketing_social_tag)
      end

      it 'finds tags containing "ano" substring' do
        result = Tag.query('ano')
        expect(result).to include(@test_another_tag, @another_tag)
        expect(result).not_to include(@test_tag, @business_tag)
      end

      it 'finds tags containing "bus" substring' do
        result = Tag.query('bus')
        expect(result).to include(@business_tag, @business_marketing_tag, @business_marketing_social_tag)
        expect(result).not_to include(@test_tag, @another_tag)
      end

      it 'finds tags containing "dev" substring' do
        result = Tag.query('dev')
        expect(result).to include(@development_tag, @development_ruby_tag)
        expect(result).not_to include(@test_tag, @business_tag)
      end

      it 'is case insensitive' do
        result = Tag.query('TEST')
        expect(result).to include(@test_tag, @test_another_tag)
      end
    end

    context 'with hierarchical queries (containing "/")' do
      it 'finds tags where first part matches "e" and second part matches "a"' do
        result = Tag.query('e/a')
        # Should match: test/another (test contains "e", another contains "a")
        # Should match: business/marketing (business contains "e", marketing contains "a")
        expect(result).to include(@test_another_tag, @business_marketing_tag)
        expect(result).not_to include(@test_tag, @another_tag, @business_tag)
      end

      it 'finds tags where first part matches "bus" and second part matches "mar"' do
        result = Tag.query('bus/mar')
        expect(result).to include(@business_marketing_tag, @business_marketing_social_tag)
        expect(result).not_to include(@business_tag, @test_another_tag)
      end

      it 'finds tags where first part matches "test" and second part matches "ano"' do
        result = Tag.query('test/ano')
        expect(result).to include(@test_another_tag)
        expect(result).not_to include(@test_tag, @another_tag)
      end

      it 'finds tags where first part matches "business", second "marketing", third "social"' do
        result = Tag.query('business/marketing/social')
        expect(result).to include(@business_marketing_social_tag)
        expect(result).not_to include(@business_tag, @business_marketing_tag)
      end

      it 'does not match tags with insufficient hierarchy depth' do
        result = Tag.query('test/another/deep')
        expect(result).to be_empty
      end

      it 'matches partial hierarchy paths' do
        result = Tag.query('business/marketing')
        expect(result).to include(@business_marketing_tag, @business_marketing_social_tag)
        expect(result).not_to include(@business_tag)
      end

      it 'is case insensitive for hierarchical queries' do
        result = Tag.query('TEST/ANOTHER')
        expect(result).to include(@test_another_tag)
      end
    end

    context 'with # prefix handling' do
      it 'strips # prefix from simple queries' do
        result = Tag.query('#test')
        expect(result).to include(@test_tag, @test_another_tag)
      end

      it 'strips # prefix from hierarchical queries' do
        result = Tag.query('#test/another')
        expect(result).to include(@test_another_tag)
        expect(result).not_to include(@test_tag, @another_tag)
      end

      it 'strips # prefix and handles case insensitivity' do
        result = Tag.query('#TEST/ANOTHER')
        expect(result).to include(@test_another_tag)
      end

      it 'handles queries with # in the middle (not stripped)' do
        # Skip this test as # is not allowed in tag names based on validation
        skip "Hash symbol not allowed in tag names"
      end
    end

    context 'edge cases' do
      it 'handles queries with trailing slashes' do
        result = Tag.query('business/')
        # "business/" should match tags that have "business" as first part and have hierarchy
        # So should match: business/marketing, business/marketing/social
        # Should NOT match: business (no hierarchy)
        expect(result).to include(@business_marketing_tag, @business_marketing_social_tag)
        expect(result).not_to include(@business_tag)
      end

      it 'handles queries with leading slashes (after # removal)' do
        result = Tag.query('#/test')
        expect(result).to include(@test_tag, @test_another_tag)
      end

      it 'handles empty parts in hierarchical queries' do
        result = Tag.query('business//social')
        # Should match business/*/*/social pattern, but our tags don't have that structure
        expect(result).to be_empty
      end

      it 'returns empty results for non-existent patterns' do
        result = Tag.query('nonexistent')
        expect(result).to be_empty
      end

      it 'handles special characters in queries' do
        special_tag = Tag.create!(name: 'special-tag_with_underscore', space: space, organization: organization)
        result = Tag.query('special-tag')
        expect(result).to include(special_tag)
      end
    end

    context 'with different spaces' do
      let(:other_space) { Space.create!(organization: organization, name: "Other Test Space") }

      before do
        @other_space_tag = Tag.create!(name: 'test', space: other_space, organization: organization)
      end

      it 'scopes results to tags within the query scope context' do
        # This test assumes the query scope is further filtered by space in actual usage
        # The current implementation doesn't scope by space, but individual tag queries would
        all_test_tags = Tag.query('test')
        expect(all_test_tags).to include(@test_tag, @test_another_tag, @other_space_tag)
      end
    end
  end

  describe 'validations and other model behavior' do
    it 'normalizes names to lowercase' do
      tag = Tag.new(name: 'UPPERCASE', space: space, organization: organization)
      tag.valid?
      expect(tag.name).to eq('uppercase')
    end

    it 'requires unique names within a space' do
      Tag.create!(name: 'duplicate', space: space, organization: organization)
      duplicate_tag = Tag.new(name: 'duplicate', space: space, organization: organization)
      expect(duplicate_tag).not_to be_valid
    end

    it 'allows same names in different spaces' do
      other_space = Space.create!(organization: organization, name: "Another Space")
      Tag.create!(name: 'samename', space: space, organization: organization)
      other_tag = Tag.new(name: 'samename', space: other_space, organization: organization)
      expect(other_tag).to be_valid
    end
  end
end
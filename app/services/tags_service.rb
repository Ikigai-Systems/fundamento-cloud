class TagsService
  include ActiveModel::Model

  attr_accessor :object, :organization

  validates :object, :organization, presence: true
  validate :validate_object_type

  def initialize(object:, organization:)
    @object = object
    @organization = organization
  end

  # Add one or more tags to the object
  # @param tag_names [Array<String>] Array of tag names with or without # prefix
  # @return [Array<Tag>] Array of tags that were added
  def add_tags(tag_names)
    raise ActiveModel::ValidationError.new(self) unless valid?

    normalized_tags = normalize_tag_names(tag_names)
    added_tags = []

    ActiveRecord::Base.transaction do
      normalized_tags.each do |tag_name|
        next if tag_name.blank?

        tag = find_or_create_tag(tag_name)
        
        # Create ObjectTag association if it doesn't exist
        object_tag = ObjectTag.find_or_create_by!(
          tag: tag,
          object: object,
          organization: organization
        )
        
        added_tags << tag if object_tag.previously_new_record?
      end
    end

    added_tags
  end

  # Remove one or more tags from the object (keeps tags in database)
  # @param tag_names [Array<String>] Array of tag names with or without # prefix
  # @return [Integer] Number of tags that were actually removed
  def remove_tags(tag_names)
    raise ActiveModel::ValidationError.new(self) unless valid?

    normalized_tags = normalize_tag_names(tag_names)
    removed_count = 0

    ActiveRecord::Base.transaction do
      normalized_tags.each do |tag_name|
        next if tag_name.blank?

        tag = find_existing_tag(tag_name)
        next unless tag

        # Remove ObjectTag association if it exists
        object_tag = ObjectTag.find_by(
          tag: tag,
          object: object,
          organization: organization
        )

        if object_tag
          object_tag.destroy!
          removed_count += 1
        end
      end
    end

    removed_count
  end

  # Replace all tags on the object with a new set
  # @param tag_names [Array<String>] Array of tag names with or without # prefix (empty array removes all)
  # @return [Array<Tag>] Array of tags now associated with the object
  def update_tags(tag_names)
    raise ActiveModel::ValidationError.new(self) unless valid?

    normalized_tags = normalize_tag_names(tag_names).reject(&:blank?)

    ActiveRecord::Base.transaction do
      # Remove all existing ObjectTag associations
      ObjectTag.where(object: object, organization: organization).destroy_all

      # Add new tags
      normalized_tags.map do |tag_name|
        tag = find_or_create_tag(tag_name)
        
        ObjectTag.create!(
          tag: tag,
          object: object,
          organization: organization
        )

        tag
      end
    end
  end

  # Get all tags currently associated with the object
  # @return [Array<Tag>]
  def current_tags
    object.tags.includes(:space).where(organization: organization)
  end

  # Get tags formatted with # prefix for display/API
  # @return [Array<String>]
  def current_tags_with_prefix
    current_tags.pluck(:name).map { |name| "##{name}" }
  end

  # Normalize a single tag name (strip #, downcase, strip whitespace)
  # @param tag_name [String]
  # @return [String]
  def self.normalize_tag_name(tag_name)
    return "" if tag_name.blank?
    
    normalized = tag_name.to_s.strip
    normalized = normalized[1..-1] if normalized.start_with?("#")
    normalized.downcase
  end

  # Validate if a tag name follows the allowed format
  # @param tag_name [String] 
  # @return [Boolean]
  def self.valid_tag_name?(tag_name)
    normalized = normalize_tag_name(tag_name)
    return false if normalized.blank?
    
    # Use the same validation as the Tag model
    !!/\A[\p{L}\p{N}\-_\/]+\z/.match(normalized)
  end

  private

  def validate_object_type
    unless ObjectTag::ALLOWED_OBJECT_TYPES.include?(object.class.name)
      errors.add(:object, "unsupported object type: #{object.class.name}. Allowed types: #{ObjectTag::ALLOWED_OBJECT_TYPES.join(', ')}")
    end
  end

  def normalize_tag_names(tag_names)
    Array(tag_names).map { |name| self.class.normalize_tag_name(name) }
  end

  def find_or_create_tag(tag_name)
    Tag.find_or_create_by!(
      name: tag_name,
      space: object.space,
      organization: organization
    )
  end

  def find_existing_tag(tag_name)
    Tag.find_by(
      name: tag_name,
      space: object.space,
      organization: organization
    )
  end
end
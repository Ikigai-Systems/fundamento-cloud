class Tag < ApplicationRecord
  include NpiOrdering

  belongs_to :organization
  belongs_to :space
  
  has_many :object_tags, dependent: :destroy
  has_many :documents, through: :object_tags, source: :object, source_type: "Document"
  has_many :tables, through: :object_tags, source: :object, source_type: "Table"

  validates_presence_of :name
  validates_uniqueness_of :name, scope: [:space_id]

  before_validation :normalize_name

  validates :name, format: { 
    with: /\A[0-9\p{L}\-_\/]+\z/, 
    message: "can only contain lowercase letters, numbers, localized characters, hyphens, underscores, and forward slashes for hierarchy"
  }

  scope :root_tags, -> { where.not("name LIKE '%/%'") }
  scope :child_tags, -> { where("name LIKE '%/%'") }

  scope :query, ->(query) {
    return all if query.blank?

    # Remove leading # if present
    normalized_query = query.strip.downcase.sub(/\A#/, "")

    if normalized_query.include?("/")
      # Handle trailing slash case (e.g., "business/")
      if normalized_query.end_with?("/")
        prefix = normalized_query.chomp("/")
        escaped_prefix = sanitize_sql_like(prefix, "\\")
        # Match tags that start with the prefix and have hierarchy (contain "/")
        where("name ILIKE ? AND name LIKE '%/%'", "#{escaped_prefix}/%")
      else
        # For hierarchical queries like "e/a", split and match each part
        parts = normalized_query.split("/").reject(&:blank?)

        conditions = []
        parts.each_with_index do |part, index|
          escaped_part = sanitize_sql_like(part, "\\")
          # Check if the nth part (1-indexed) of the split name contains the substring
          conditions << "SPLIT_PART(name, '/', #{index + 1}) ILIKE '%#{escaped_part}%'"
        end

        # Ensure the tag has at least as many levels as the query
        depth_condition = "ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(name, '/'), 1) >= #{parts.length}"

        where("(#{conditions.join(' AND ')}) AND #{depth_condition}")
      end
    else
      # For simple queries like "ano", match against the full name
      where("name ILIKE ?", "%#{sanitize_sql_like(normalized_query, '\\')}%")
    end
  }

  def parent_name
    return nil unless hierarchical?
    name.split("/")[0..-2].join("/")
  end

  def parent
    return nil unless hierarchical?
    self.class.find_by(name: parent_name, space: space)
  end

  def children
    self.class.where("name LIKE ? AND name != ?", "#{name}/%", name)
               .where(space: space)
               .where.not("name LIKE ?", "#{name}/%/%")
  end

  def descendants
    self.class.where("name LIKE ? AND name != ?", "#{name}/%", name)
               .where(space: space)
  end

  def ancestors
    return [] unless hierarchical?
    
    parts = name.split("/")
    ancestor_names = []
    
    (1...parts.length).each do |i|
      ancestor_names << parts[0...i].join("/")
    end
    
    self.class.where(name: ancestor_names, space: space).order(:name)
  end

  def hierarchical?
    name.include?("/")
  end

  def depth
    name.count("/")
  end

  def root_name
    name.split("/").first
  end

  def leaf_name
    name.split("/").last
  end

  def hierarchy_path
    name.split("/")
  end

  def hashtag
    "##{name}"
  end

  private

  def normalize_name
    return unless name.present?
    self.name = name.strip.downcase
  end
end
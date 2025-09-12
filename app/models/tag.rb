class Tag < ApplicationRecord
  include ModelWithNpiAsParam

  belongs_to :organization
  belongs_to :space
  
  has_many :object_tags, dependent: :destroy
  has_many :documents, through: :object_tags, source: :object, source_type: "Document"
  has_many :tables, through: :object_tags, source: :object, source_type: "Table"

  validates_presence_of :name
  validates_uniqueness_of :name, scope: [:space_id]

  before_validation :normalize_name

  validates :name, format: { 
    with: /\A[a-z0-9\p{L}\-_\/]+\z/, 
    message: "can only contain lowercase letters, numbers, localized characters, hyphens, underscores, and forward slashes for hierarchy"
  }

  scope :root_tags, -> { where.not("name LIKE '%/%'") }
  scope :child_tags, -> { where("name LIKE '%/%'") }

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

  private

  def normalize_name
    return unless name.present?
    self.name = name.strip.downcase
  end
end
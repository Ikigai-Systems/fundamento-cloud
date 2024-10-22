class PackVersion < ApplicationRecord
  belongs_to :organization
  belongs_to :pack

  has_one_attached :bundle

  acts_as_sequenced scope: :pack_id, column: :version
end

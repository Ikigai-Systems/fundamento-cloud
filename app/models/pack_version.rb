class PackVersion < ApplicationRecord
  belongs_to :organization
  belongs_to :pack

  acts_as_sequenced scope: :pack_id, column: :version
end

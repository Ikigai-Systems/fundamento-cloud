class Attachment < ApplicationRecord
  belongs_to :organization
  belongs_to :parent, polymorphic: true, optional: true # FIXME: This should be required, but need to migrate existing data first
end

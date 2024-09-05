class Attachment < ApplicationRecord
  belongs_to :organization
  belongs_to :parent, polymorphic: true
end

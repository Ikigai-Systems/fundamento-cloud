class ObjectVisitor < ApplicationRecord
  belongs_to :organization_user
  belongs_to :object, polymorphic: true
end
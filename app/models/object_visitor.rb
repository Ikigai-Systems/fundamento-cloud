class ObjectVisitor < ApplicationRecord
  audited enabled: false

  belongs_to :user
  belongs_to :object, polymorphic: true
end
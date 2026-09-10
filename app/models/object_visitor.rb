class ObjectVisitor < ApplicationRecord
  skip_auditing

  belongs_to :user
  belongs_to :object, polymorphic: true
end
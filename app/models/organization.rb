class Organization < ApplicationRecord
  has_many :organizations_users, class_name: :OrganizationUser
  has_many :users, through: :organizations_users

  has_many :spaces
  has_many :documents
  has_many :attachments

  validates_presence_of :name
end

class Organization < ApplicationRecord
  has_many :organizations_users, class_name: :OrganizationUser, dependent: :destroy
  has_many :users, through: :organizations_users
  has_many :invited_users, dependent: :destroy

  has_many :spaces, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :attachments, dependent: :destroy
  has_many :tables, class_name: "Tables::Table", dependent: :destroy
  has_many :public_links, dependent: :destroy

  validates_presence_of :name

  after_create :create_default_space

  private

  def create_default_space
    self.spaces.create!(name: self.name + " Space")
  end
end

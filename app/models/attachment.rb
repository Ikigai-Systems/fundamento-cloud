class Attachment < ApplicationRecord
  belongs_to :organization
  belongs_to :parent, polymorphic: true

  # Active Storage association for migrating from database storage
  has_one_attached :file

  # Helper method to check which storage is being used
  def stored_in_active_storage?
    file.attached?
  end

  def stored_in_database?
    data.present?
  end
end

class PublicLink < ApplicationRecord
  belongs_to :organization
  belongs_to :object, polymorphic: true
  belongs_to :updated_by, class_name: "User", optional: true

  validates_presence_of :object

  validates :object_type, inclusion: { in: %w[Document] }

  validates_uniqueness_of :object_id, scope: [:organization_id, :object_type]

  # Normalize emails before validation and save
  before_validation :normalize_allowed_emails
  validate :validate_allowed_emails_format

  # Return an empty array when allowed_emails is nil or empty
  def allowed_emails
    super&.compact&.reject(&:blank?) || []
  end

  def allowed_users
    User.where(email: allowed_emails).sort_by(&:display_name)
  end

  def pending_users
    # Returns those allowed_emails that still don't match users
    self.allowed_emails.sort.without(self.allowed_users.map(&:email)).map do |email|
      User.new(email: email).tap do |user|
        def user.display_name
          email
        end

        def user.initials
          email.first(2).upcase
        end
      end
    end
  end

  def generate_npi
    self.id = Nanoid.generate(size: 10)
  end

  private

  def normalize_allowed_emails
    if self.allowed_emails.present?
      self.allowed_emails = self.allowed_emails.map(&:to_s).map(&:strip).map(&:downcase).compact.reject(&:blank?).uniq
    end
  end

  def validate_allowed_emails_format
    return if self.allowed_emails.blank?

    # Normalize first for validation (in case this runs before the callback)
    normalize_allowed_emails if self.allowed_emails.present?

    invalid_emails = []
    self.allowed_emails.each do |email|
      next if email.blank?
      
      unless email.match?(Devise.email_regexp)
        invalid_emails << email
      end
    end

    if invalid_emails.any?
      errors.add(:allowed_emails, "contains invalid email addresses: #{invalid_emails.join(', ')}")
    end
  end
end

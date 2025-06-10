class SharePublicLinkService
  include ActiveModel::Model

  attr_accessor :public_link, :email, :current_user

  validates :email, presence: true, format: { with: Devise.email_regexp }
  validates :public_link, :current_user, presence: true

  def initialize(public_link:, email:, current_user:)
    @public_link = public_link
    @email = email&.strip&.downcase
    @current_user = current_user
  end

  def call
    return false unless valid?
    return false if email_already_allowed?

    add_email_to_allowed_list && send_invitation_email
  end

  def email_already_allowed?
    public_link.allowed_emails.include?(email)
  end

  private

  def add_email_to_allowed_list
    public_link.allowed_emails = public_link.allowed_emails + [email]
    public_link.updated_by = current_user
    public_link.save
  end

  def send_invitation_email
    PublicLinkMailer.with(pundit_user: PolicyUserContext.new(current_user, public_link.organization))
                   .invitation_instructions(public_link, email)
                   .deliver_now
    true
  rescue => e
    Rails.logger.error "Failed to send invitation email: #{e.message}"
    false
  end
end
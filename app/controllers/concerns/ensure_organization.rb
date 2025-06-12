module EnsureOrganization
  extend ActiveSupport::Concern

  included do
    before_action :ensure_organization_exists
    before_action :select_current_organization
    before_action :load_current_organization_from_cookie
    before_action :ensure_space_exists
  end

  protected

  def ensure_organization_exists
    if current_user.present? && current_user.organizations.size == 0
      organization_name = generate_organization_name
      
      # Create the organization for the user
      organization = Organization.create!(name: organization_name)
      organization.organization_users.create!(user: current_user, role: :manager)
    end
  end

  def select_current_organization
    return if cookies.encrypted[:organization_id].present?

    return if current_user.nil?

    if current_user.organizations.size == 1
      cookies.encrypted[:organization_id] = current_user.organizations.first.id
    else
      redirect_to organizations_path, notice: "Please select an organization you want to switch to."
    end
  end

  def load_current_organization_from_cookie
    return if cookies.encrypted[:organization_id].nil?

    return if current_user.nil?

    RequestContext.current_organization =
      current_user.organizations.find_by_id(cookies.encrypted[:organization_id])

    if RequestContext.current_organization.nil?
      # Cookie has invalid value, so let's retry selecting it
      cookies.encrypted[:organization_id] = nil

      select_current_organization
    end
  end

  def ensure_space_exists
    if current_user.present? && current_organization.present? && current_organization.spaces.empty?
      current_organization.spaces.create!(name: "Default")
    end
  end

  private

  def generate_organization_name
    Thread.current[:random_word_adjs] ||= RandomWord.adjs
    Thread.current[:random_word_nouns] ||= RandomWord.nouns
    
    adjective = Thread.current[:random_word_adjs].next.capitalize
    noun = Thread.current[:random_word_nouns].next.capitalize

    "#{adjective} #{noun}"
  end
end
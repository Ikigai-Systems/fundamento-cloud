module EnsureOrganization
  extend ActiveSupport::Concern

  included do
    before_action :load_current_organization_from_cookie, if: -> { current_user.present? }
    before_action :ensure_organization_exists, if: -> { current_user.present? && current_organization.nil? }
    before_action :select_current_organization, if: -> { current_user.present? && current_organization.nil? }
    before_action :ensure_space_exists, if: -> { current_user.present? && current_organization.present? }
  end

  protected

  def load_current_organization_from_cookie
    return if cookies.encrypted[:organization_id].nil?

    self.current_organization =  current_user.organizations.find_by_id(cookies.encrypted[:organization_id])

    if self.current_organization.nil?
      # Cookie has invalid value, so let's retry selecting it
      cookies.encrypted[:organization_id] = nil
    end
  end

  def ensure_organization_exists
    if current_user.organizations.size == 0
      organization_name = generate_organization_name
      
      # Create the organization for the user
      organization = Organization.create!(name: organization_name)
      organization.organization_memberships.create!(user: current_user, role: :manager)
    end
  end

  def select_current_organization
    if current_user.organizations.reload.size == 1
      first_organization = current_user.organizations.first

      self.current_organization = first_organization
      cookies.encrypted[:organization_id] = first_organization.id
    else
      redirect_to organizations_path, notice: "Please select an organization you want to switch to."
    end
  end

  def ensure_space_exists
    if current_organization.spaces.empty?
      current_organization.spaces.create!(name: "Default")
    end
  end

  private

  def generate_organization_name
    # Take a sample of words and pick randomly to avoid fiber threading issues
    # Using Thread.current to store enumerators causes "fiber called across threads" error
    # in multi-threaded environments (like production with Puma)
    adjective = RandomWord.adjs.take(100).sample.capitalize
    noun = RandomWord.nouns.take(100).sample.capitalize

    "#{adjective} #{noun}"
  end
end
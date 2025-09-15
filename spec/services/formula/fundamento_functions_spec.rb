require "rails_helper"

RSpec.describe Formula::Engine, type: :model do
  fixtures :organizations, :users, :organization_users

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }

  let(:engine) { Formula::Engine.new(
    additional_functions: Formula::FundamentoFunctions.new(pundit_user: PolicyUserContext.new(user, organization)).functions)
  }

  describe "User" do
    it "returns current user" do
      result = engine.evaluate('User()')

      expect(result).to include(first_name: user.first_name, last_name: user.last_name)
    end
  end

  describe "Organization" do
    it "returns current organization" do
      result = engine.evaluate('Organization()')

      expect(result).to include(name: organization.name)
    end
  end

  describe "Table" do

  end
end
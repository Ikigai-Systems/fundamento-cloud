class ApiTokenPolicy < ApplicationPolicy
  def create?
    true
  end

  alias_method :update?, :create?
  alias_method :destroy?, :create?
end
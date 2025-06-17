class UserPolicy < ApplicationPolicy
  def show?
    (user.organizations & record.organizations).count > 0
  end

  def update?
    record == user
  end
end
# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user_context, :record

  delegate :user, to: :user_context
  delegate :current_organization, to: :user_context
  delegate :organization_user, to: :user_context

  def initialize(user_context, record)
    @user_context = user_context
    @record = record
  end

  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def update?
    false
  end

  def destroy?
    false
  end

  class Scope
    def initialize(user_context, scope)
      @user_context = user_context
      @scope = scope
    end

    def resolve
      raise NoMethodError, "You must define #resolve in #{self.class}"
    end

    private

    attr_reader :user_context, :scope
  end
end

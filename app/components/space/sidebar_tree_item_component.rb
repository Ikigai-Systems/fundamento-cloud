# frozen_string_literal: true

class Space::SidebarTreeItemComponent < ViewComponent::Base
  def initialize(document:, level: 0, has_children: false, selected: false, space:)
    @document = document
    @level = level
    @has_children = has_children
    @selected = selected
    @space = space
  end

  private

  def show_archived_cookie
    helpers.cookies["ikigai_userPreferences_showArchived"] == "true"
  end

  def hidden?
    @document.archived? && !show_archived_cookie
  end

  def visibility_target_attribute
    @document.archived? ? "hideable" : nil
  end

  def container_classes
    classes = ["content-link-container", "group"]
    classes << "archived" if @document.archived?
    classes << "selected" if @selected
    classes
  end

  def can_update_space?
    Pundit.policy(helpers.pundit_user, @space).update?
  end
end

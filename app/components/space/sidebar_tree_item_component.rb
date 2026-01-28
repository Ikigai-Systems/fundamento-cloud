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

  def padding_left_px
    @level * 16
  end

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

  def chevron_classes
    classes = ["multi-items-expander", "size-6", "ml-1"]
    classes << "hidden" unless @has_children
    classes
  end

  def dot_classes
    classes = ["single-item-dot", "pt-1", "mx-2.5", "-mt-[0.3rem]"]
    classes << "hidden" if @has_children
    classes
  end

  def can_update_space?
    Pundit.policy(helpers.pundit_user, @space).update?
  end
end

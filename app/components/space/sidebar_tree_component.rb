# frozen_string_literal: true

class Space::SidebarTreeComponent < ViewComponent::Base
  def initialize(node:, documents:, space:, params:, level: 0)
    @node = node || []
    @documents = documents
    @space = space
    @params = params
    @level = level
  end

  private

  def find_document(id)
    @documents.find { |doc| doc.id == id }
  end

  def selected?(document)
    document.id.to_s == @params.dig(:object, :id) &&
      document.class.to_s == @params.dig(:object, :type)
  end

  def has_children?(item)
    item["children"].length > 0
  end

  def scroll_into_view_controller?(document)
    selected?(document) ? " scroll-into-view" : ""
  end
end

# frozen_string_literal: true

class ObjectIcon < ViewComponent::Base
  erb_template <<-ERB
    <% if @object.class == Document %>
      <i class="fa-regular fa-file-lines"></i>
    <% elsif @object.class == Table %>
      <i class="fa-regular fa-table"></i>
    <% end %>
  ERB

  def initialize(object:)
    @object = object
  end
end

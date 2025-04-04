# frozen_string_literal: true

class ObjectIcon < ViewComponent::Base
  erb_template <<-ERB
    <% if @type == Document.to_s %>
      <i class="fa-regular fa-file-lines"></i>
    <% elsif @type == Table.to_s %>
      <i class="fa-regular fa-table"></i>
    <% end %>
  ERB

  def initialize(object: nil, type: nil)
    @type = type || object&.class&.to_s

    assert @type.present?, "You need to pass object or type"
  end
end

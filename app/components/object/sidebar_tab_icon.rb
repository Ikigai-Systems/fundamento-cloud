class Object::SidebarTabIcon < ViewComponent::Base
  erb_template <<-ERB
    <div data-controller="tooltip" class="relative" data-action="pointerenter->tooltip#show pointerleave->tooltip#hide focusin->tooltip#show focusout->tooltip#hide" aria-label="<%= @label %>">
      <%= content %>

      <template data-tooltip-target="content">
        <div class="popover-tooltip-card m-1" data-tooltip-target="card">
          <p><%= @tooltip || @label %></p>
        </div>
      </template>
    </div>
  ERB

  def initialize(label:, tooltip: nil)
    @tooltip = tooltip
    @label = label
  end
end
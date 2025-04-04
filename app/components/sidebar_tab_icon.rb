class SidebarTabIcon < ViewComponent::Base
  erb_template <<-ERB
    <div data-controller="popover" class="relative" data-action="mouseenter->popover#show mouseleave->popover#hide" >
      <%= content %>

      <template data-popover-target="content">
        <div class="popover-tooltip-card m-1" data-popover-target="card">
          <p><%= @tooltip %></p>
        </div>
      </template>
    </div>
  ERB

  def initialize(tooltip:)
    super
    @tooltip = tooltip
  end
end
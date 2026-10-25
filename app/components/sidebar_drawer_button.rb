# Opens a sidebar as a drawer on screens narrower than lg, where it no longer fits beside the
# content. Wider screens collapse the sidebars from their edge instead, so the button hides there.
#
# It sits at the same edge as its sidebar and shows the chevron the sidebar's own collapsed
# trigger shows on desktop: > leftmost for the space sidebar, < rightmost for the content sidebar.
class SidebarDrawerButton < ViewComponent::Base
  erb_template <<-ERB
    <button type="button"
            class="document-toolbar-button lg:hidden <%= @class %>"
            data-controller="sidebar-drawer-button"
            data-action="sidebar-drawer-button#toggle"
            aria-controls="<%= @sidebar_id %>"
            aria-expanded="false"
            aria-label="<%= @label %>"
            title="<%= @label %>">
      <span class="<%= @icon %> size-5" aria-hidden="true"></span>
    </button>
  ERB

  # Classes are literal so Tailwind's scanner finds them. The toolbar button's own left margin
  # spaces it from its neighbours, so the leftmost one drops it, and pushes the rest away instead.
  SIDES = {
    left: { sidebar_id: "space-sidebar", label: "Open navigation", icon: "icon-[tabler--chevron-right]", class: "ml-0 mr-auto" },
    right: { sidebar_id: "content-sidebar", label: "Show details", icon: "icon-[tabler--chevron-left]", class: nil },
  }.freeze

  def initialize(side:)
    @sidebar_id, @label, @icon, @class = SIDES.fetch(side).values_at(:sidebar_id, :label, :icon, :class)
  end
end

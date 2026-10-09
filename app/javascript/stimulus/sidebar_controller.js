import {Toggle} from "tailwindcss-stimulus-components"
import Cookies from "js-cookie"

// Matches Tailwind's `lg` breakpoint, where the sidebars stop being drawers (sidebar.tailwind.css)
const besideContent = window.matchMedia("(min-width: 1024px)")

// A space or content sidebar, which behaves differently by width:
//
// - lg and up, it sits beside the content and collapses from its edge (the `collapsed` class,
//   driven by Toggle). The state persists in a cookie, so the server renders it right away.
// - Below lg, it is a drawer over the content. A drawer is always closed when a page loads, so
//   no cookie is involved and the server needs no idea of the viewport. It opens from a top-bar
//   button (sidebar-drawer-button) and closes on the backdrop, Escape, or navigating.
export default class SidebarController extends Toggle {
  static values = {
    cookieKey: String,
  }

  openValueChanged() {
    Cookies.set(this.cookieKeyValue, this.openValue.toString())
  }

  get sidebarId() {
    return this.element.querySelector("aside").id
  }

  get drawerOpen() {
    return this.element.classList.contains("drawer-open")
  }

  // The edge trigger and the `[` / `]` shortcuts. Below lg the trigger is hidden, but a tablet
  // keyboard still sends the shortcut, which should work the drawer rather than a cookie nobody sees.
  toggle(event) {
    if (besideContent.matches) {
      super.toggle(event)
    } else {
      this.setDrawer(!this.drawerOpen)
    }
  }

  // `sidebar-drawer:toggle` from a top-bar button. Opening one drawer closes the other.
  toggleDrawer({ detail: { controls } }) {
    this.setDrawer(controls === this.sidebarId && !this.drawerOpen)
  }

  closeDrawer() {
    this.setDrawer(false)
  }

  // Only navigation of the content frame closes the drawer. The space sidebar loads its own
  // frames (the tree, its tabs), and those must leave it open.
  closeDrawerAfterNavigation(event) {
    if (event.target.id === "content") this.setDrawer(false)
  }

  setDrawer(open) {
    if (open === this.drawerOpen) return

    this.element.classList.toggle("drawer-open", open)
    document.querySelectorAll(`[aria-controls="${this.sidebarId}"]`).forEach((button) => {
      button.setAttribute("aria-expanded", open.toString())
    })
  }
}

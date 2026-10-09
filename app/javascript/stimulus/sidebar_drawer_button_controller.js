import {Controller} from "@hotwired/stimulus"

// A top-bar button that opens or closes a sidebar drawer on narrow screens. The sidebar lives
// outside the button's part of the page (and the right one is replaced with every content frame
// navigation), so the button announces itself on window rather than holding a reference to it.
export default class SidebarDrawerButtonController extends Controller {
  toggle() {
    window.dispatchEvent(new CustomEvent("sidebar-drawer:toggle", {
      detail: { controls: this.element.getAttribute("aria-controls") },
    }))
  }
}

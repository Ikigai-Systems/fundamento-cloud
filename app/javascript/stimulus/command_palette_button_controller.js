import {Controller} from "@hotwired/stimulus"

// A top-bar button that opens the command palette, which otherwise opens only with Ctrl+K or
// Cmd+K: out of reach on a phone or tablet. The palette lives outside the top bar, so the button
// announces itself on window, like the sidebar drawer buttons.
export default class CommandPaletteButtonController extends Controller {
  open() {
    window.dispatchEvent(new CustomEvent("command-palette:open"))
  }
}

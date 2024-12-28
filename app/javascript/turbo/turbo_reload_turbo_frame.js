import { Turbo } from "@hotwired/turbo-rails"

// Define a new Turbo Stream action called 'reload_turbo_frame'
Turbo.StreamActions.reload_turbo_frame = function() {
  const frame_selector = this.getAttribute("target")
  if (frame_selector) {
    document.querySelector(frame_selector)?.reload();
  }
}
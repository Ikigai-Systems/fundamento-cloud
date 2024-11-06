import { Turbo } from "@hotwired/turbo-rails"

// Define a new Turbo Stream action called 'redirect_to'
Turbo.StreamActions.redirect_to = function() {
  const url = this.getAttribute("target")
  if (url) {
    window.location.href = url
  }
}
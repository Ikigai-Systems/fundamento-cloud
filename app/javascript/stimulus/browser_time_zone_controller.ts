import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="browser-time-zone" on a <select> of IANA time zones.
// Preselects the browser's zone while the select still holds its default, so a new
// organization starts in the creator's zone rather than UTC.
export default class BrowserTimeZoneController extends Controller<HTMLSelectElement> {
  connect(): void {
    if (this.element.value !== "UTC") return

    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (Array.from(this.element.options).some((option) => option.value === browserZone)) {
      this.element.value = browserZone
    }
  }
}

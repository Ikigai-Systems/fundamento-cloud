import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="collapsible"
export default class extends Controller {
  static targets = ["collapsible", "icon"];

  toggle() {
    this.iconTarget.classList.toggle("rotate-90")
    this.collapsibleTargets.forEach(element => {
      element.classList.toggle("max-h-0");
    })
  }
}

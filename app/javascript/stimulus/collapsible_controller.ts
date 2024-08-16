import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="collapsible"
export default class extends Controller<HTMLElement> {
  static targets = ["collapsible", "icon"];

  declare iconTarget: HTMLElement;
  declare collapsibleTargets: HTMLElement[];

  toggle() {
    this.iconTarget.classList.toggle("rotate-90")
    this.collapsibleTargets.forEach(element => {
      element.classList.toggle("max-h-0");
    })
  }
}

import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="collapsible"
export default class extends Controller<HTMLElement> {
  static targets = ["collapsible", "icon"];
  static values = {
    collapsed: Boolean,
  }

  declare iconTarget: HTMLElement;
  declare collapsibleTargets: HTMLElement[];
  declare collapsedValue: boolean;

  toggle() {
    this.collapsedValue = !this.collapsedValue;
  }

  collapsedValueChanged() {
    if (this.collapsedValue) {
      this.iconTarget.classList.remove("rotate-90")
      this.collapsibleTargets.forEach(element => {
        element.classList.add("max-h-0");
      })
    } else {
      this.iconTarget.classList.add("rotate-90")
      this.collapsibleTargets.forEach(element => {
        element.classList.remove("max-h-0");
      })

    }
  }
}

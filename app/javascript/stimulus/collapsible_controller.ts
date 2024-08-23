import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="collapsible"
export default class extends Controller<HTMLElement> {
  static targets = ["collapsible", "icon"];
  static values = {
    collapsed: {type: Boolean, default: true},
  };

  declare iconTarget: HTMLElement;
  declare collapsibleTargets: HTMLElement[];
  declare collapsedValue: boolean;
  declare element: HTMLElement;

  initialize() {
    //todo: ideally initial auto-expand should be server-side rendered, not here in frontend
    if (this.element.dataset.collapsibleExpandToThis) {
      let collapsible = this.element;
      while (collapsible) {
        collapsible.dataset.collapsibleCollapsedValue = "false";
        collapsible = collapsible.parentElement?.closest("li[data-controller~='collapsible']");
      }
    }
  }

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

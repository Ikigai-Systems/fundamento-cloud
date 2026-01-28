import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="collapsible"
export default class extends Controller<HTMLElement> {
  static targets = ["content", "trigger"];
  static values = {
    collapsed: {type: Boolean, default: true},
    expandToThis: {type: Boolean, default: false},
    hasChildren: {type: Boolean, default: false},
  };

  declare contentTarget: HTMLElement;
  declare triggerTarget: HTMLElement;
  declare collapsedValue: boolean;
  declare expandToThisValue: boolean;
  declare hasChildrenValue: boolean;
  declare element: HTMLElement;

  initialize() {
    // Auto-expand to selected item
    if (this.expandToThisValue) {
      this.expandAncestors();
    }
  }

  toggle(event?: Event) {
    event?.preventDefault();
    this.collapsedValue = !this.collapsedValue;
  }

  expand() {
    this.collapsedValue = false;
  }

  collapse() {
    this.collapsedValue = true;
  }

  collapsedValueChanged() {
    // Emit event for other controllers
    this.dispatch("changed", {
      detail: {collapsed: this.collapsedValue},
      bubbles: true,
    });
  }

  private expandAncestors() {
    let ancestor = this.element.parentElement?.closest("[data-controller~='collapsible']") as HTMLElement;
    while (ancestor) {
      const controller = this.application.getControllerForElementAndIdentifier(
        ancestor,
        "collapsible"
      ) as typeof this;
      controller?.expand();
      ancestor = ancestor.parentElement?.closest("[data-controller~='collapsible']") as HTMLElement;
    }
  }
}

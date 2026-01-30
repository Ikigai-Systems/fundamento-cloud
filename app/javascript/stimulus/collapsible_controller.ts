import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="collapsible"
export default class extends Controller<HTMLElement> {
  static targets = ["content", "trigger"];
  static values = {
    collapsed: {type: Boolean, default: true},
    expandToThis: {type: Boolean, default: false},
    hasChildren: {type: Boolean, default: false},
  };
  static classes = ["collapsed", "expanded", "leaf"];

  declare contentTarget: HTMLElement;
  declare triggerTarget: HTMLElement;
  declare collapsedValue: boolean;
  declare expandToThisValue: boolean;
  declare hasChildrenValue: boolean;
  declare element: HTMLElement;
  declare readonly hasCollapsedClass: boolean;
  declare readonly hasExpandedClass: boolean;
  declare readonly hasLeafClass: boolean;
  declare readonly collapsedClasses: string[];
  declare readonly expandedClasses: string[];
  declare readonly leafClasses: string[];

  initialize() {
    // Auto-expand to selected item
    if (this.expandToThisValue) {
      this.expandAncestors();
    }
  }

  connect() {
    this.updateTriggerState();
  }

  toggle(event?: Event) {
    event?.preventDefault();

    // Only toggle if has children
    if (this.hasChildrenValue) {
      this.collapsedValue = !this.collapsedValue;
    }
  }

  expand() {
    this.collapsedValue = false;
  }

  collapse() {
    this.collapsedValue = true;
  }

  collapsedValueChanged() {
    this.updateTriggerState();

    // Emit event for other controllers
    this.dispatch("changed", {
      detail: {collapsed: this.collapsedValue},
      bubbles: true,
    });
  }

  hasChildrenValueChanged() {
    this.updateTriggerState();
  }

  private updateTriggerState() {
    if (!this.hasTriggerTarget) return;

    // Remove all state classes
    if (this.hasCollapsedClass) {
      this.triggerTarget.classList.remove(...this.collapsedClasses);
    }
    if (this.hasExpandedClass) {
      this.triggerTarget.classList.remove(...this.expandedClasses);
    }
    if (this.hasLeafClass) {
      this.triggerTarget.classList.remove(...this.leafClasses);
    }

    // Apply appropriate state class
    if (!this.hasChildrenValue) {
      if (this.hasLeafClass) {
        this.triggerTarget.classList.add(...this.leafClasses);
      }
    } else if (this.collapsedValue) {
      if (this.hasCollapsedClass) {
        this.triggerTarget.classList.add(...this.collapsedClasses);
      }
    } else {
      if (this.hasExpandedClass) {
        this.triggerTarget.classList.add(...this.expandedClasses);
      }
    }
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

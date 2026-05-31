import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["row", "button"];
  static values = { current: { type: String, default: "all" } };

  filter(event) {
    this.currentValue = event.currentTarget.dataset.filter;
  }

  currentValueChanged() {
    this.rowTargets.forEach((row) => {
      const matches = this.currentValue === "all" || row.dataset.status === this.currentValue;
      row.classList.toggle("hidden", !matches);
    });

    this.buttonTargets.forEach((button) => {
      const isActive = button.dataset.filter === this.currentValue;
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }
}

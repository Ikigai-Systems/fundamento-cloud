import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="prevent-double-submit"
export default class extends Controller<HTMLElement> {
  connect() {
    this.element.addEventListener("submit", () => {
      this.element.querySelectorAll<HTMLInputElement>("input[type='submit']").forEach(submitInput => {
        if (submitInput.dataset.disableWith) {
          submitInput.innerHTML = submitInput.dataset.disableWith;
        }
        submitInput.disabled = true;
      });
    });
  }
}

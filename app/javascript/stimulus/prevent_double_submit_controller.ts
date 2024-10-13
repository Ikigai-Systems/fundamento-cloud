import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="prevent-double-submit"
export default class extends Controller<HTMLElement> {
  connect() {
    this.element.addEventListener('submit', (e) => {
      e.target.querySelectorAll("input[type='submit']").forEach(submitInput => {
        submitInput.innerHTML = submitInput.dataset.disableWith;
        submitInput.disabled = true;
      });
    });
  }
}

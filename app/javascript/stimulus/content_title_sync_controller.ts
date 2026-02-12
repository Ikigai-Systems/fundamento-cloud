import {Controller} from "@hotwired/stimulus"

export default class extends Controller<HTMLElement> {
  private handler!: (event: Event) => void;

  connect() {
    this.handler = (event: Event) => {
      const {id, title} = (event as CustomEvent).detail;
      const el = this.element.querySelector(`[data-document-id="${id}"] span.truncate`);
      if (el) {
        el.textContent = title;
      }
    };
    window.addEventListener("content-title-updated", this.handler);
  }

  disconnect() {
    window.removeEventListener("content-title-updated", this.handler);
  }
}

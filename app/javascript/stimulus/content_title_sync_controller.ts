import {Controller} from "@hotwired/stimulus"
import {applyObjectIcon} from "../sidebar/object_icon"
import {ObjectIcon} from "../sidebar/types"

// Keeps sidebar rows in step with a rename without waiting for a frame reload.
//
// The event carries what the server actually stored, not what the user typed, so
// a title of "🔥 Roadmap" arrives here already split into the label "Roadmap" and
// the icon 🔥. Nothing on this side needs to know what an emoji is.
export default class extends Controller<HTMLElement> {
  private handler!: (event: Event) => void;

  connect() {
    this.handler = (event: Event) => {
      const {id, title, icon} =
        (event as CustomEvent<{id: string; title: string; icon?: ObjectIcon | null}>).detail;
      const container = this.element.querySelector<HTMLElement>(`[data-document-id="${id}"]`);
      if (!container) return;

      const label = container.querySelector<HTMLElement>("span.truncate");
      if (label) label.textContent = title;

      applyObjectIcon(container, icon);
    };
    window.addEventListener("content-title-updated", this.handler);
  }

  disconnect() {
    window.removeEventListener("content-title-updated", this.handler);
  }
}

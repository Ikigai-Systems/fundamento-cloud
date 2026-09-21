import {Controller} from "@hotwired/stimulus"
import {applyObjectIcon} from "../sidebar/object_icon"
import {CONTENT_UPDATED, contentUpdateFrom} from "../content_updated"

// Keeps sidebar rows in step with a rename without waiting for a frame reload.
//
// Only the naming fields of the shared content-updated event are this controller's business;
// sidebar_tree_controller owns everything the document tree renders from its own JSON. This
// one covers the rows that stay server-rendered, i.e. the Tables section.
//
// The event carries what the server actually stored, not what the user typed, so
// a title of "🔥 Roadmap" arrives here already split into the label "Roadmap" and
// the icon 🔥. Nothing on this side needs to know what an emoji is.
export default class extends Controller<HTMLElement> {
  private handler!: (event: Event) => void;

  connect() {
    this.handler = (event: Event) => {
      const update = contentUpdateFrom(event);
      if (!update || update.title === undefined) return;

      const container = this.element.querySelector<HTMLElement>(`[data-document-id="${update.id}"]`);
      if (!container) return;

      const label = container.querySelector<HTMLElement>("span.truncate");
      if (label) label.textContent = update.title;

      applyObjectIcon(container, update.icon);
    };
    window.addEventListener(CONTENT_UPDATED, this.handler);
  }

  disconnect() {
    window.removeEventListener(CONTENT_UPDATED, this.handler);
  }
}

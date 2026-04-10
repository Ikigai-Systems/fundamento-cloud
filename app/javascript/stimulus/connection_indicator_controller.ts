import {Controller} from "@hotwired/stimulus";
import createFlash from "../utils/createFlash";

export default class extends Controller {
  static targets = ["offlineLabel"];

  declare offlineLabelTarget: HTMLElement;

  private wasStale: boolean = false;

  update(event: CustomEvent<{stale: boolean}>) {
    const {stale} = event.detail;
    this.offlineLabelTarget.style.display = stale ? "" : "none";

    if (stale !== this.wasStale) {
      createFlash({
        message: stale
          ? "Disconnected from the server. Your changes are stored only locally."
          : "Connection to server restored.",
        type: stale ? "error" : "notice",
        replacePrevious: true,
        key: "isStaleMessage",
        duration: stale ? undefined : "short",
      });
      this.wasStale = stale;
    }
  }
}

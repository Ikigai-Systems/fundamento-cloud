import {Controller} from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["offlineLabel"];

  declare offlineLabelTarget: HTMLElement;

  update(event: CustomEvent<{stale: boolean}>) {
    this.offlineLabelTarget.style.display = event.detail.stale ? "" : "none";
  }
}

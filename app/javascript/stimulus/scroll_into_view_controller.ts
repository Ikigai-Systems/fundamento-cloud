import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="scroll-into-view"
export default class extends Controller<HTMLElement> {
  connect() {
    this.element.scrollIntoView({behavior: "instant"});
  }
}

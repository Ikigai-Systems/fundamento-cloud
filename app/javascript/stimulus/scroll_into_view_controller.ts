import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="scroll-into-view"
export default class extends Controller<HTMLElement> {
  connect() {
    // because the element or the container that include the element might be dynamically added
    // scroll into view preferable after DOM was updated, another solution that worked was setTimeout
    // but requestAnimationFrame seems more elegant
    requestAnimationFrame(() => {
      this.element.scrollIntoView({behavior: "instant"});
    });
  }
}

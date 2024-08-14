import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="visibility"
export default class extends Controller {
  static targets = ["hideable"];

  onChange(event) {
    this.hideableTargets.forEach(element => {
      element.hidden = !event.detail.value;
    })
  }
}

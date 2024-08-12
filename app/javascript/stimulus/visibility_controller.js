import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="visibility"
export default class extends Controller {
  static targets = ["hideable"];

  show() {
    this.hideableTargets.forEach(element => {
      element.hidden = false;
    })
  }

  hide() {
    this.hideableTargets.forEach(element => {
      element.hidden = true;
    })
  }
}

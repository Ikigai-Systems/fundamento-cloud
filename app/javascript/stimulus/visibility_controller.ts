import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="visibility"
export default class extends Controller<HTMLElement> {
  static targets = ["hideable"];

  declare hideableTargets: HTMLElement[];

  onChange(event) {
    this.hideableTargets.forEach(element => {
      element.hidden = !event.detail.value;
    })
  }
}

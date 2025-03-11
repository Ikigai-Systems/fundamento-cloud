import {Controller} from "@hotwired/stimulus"
import "ninja-keys"

// Connects to data-controller="command-palette"
export default class CommandPaletteController extends Controller<HTMLElement> {
  static values = {
    commands: Array,
  }

  declare commandsValue: object[];

  connect() {
    this.element.addEventListener("change", this.handleChange);
    this.element.addEventListener("selected", this.handleSelected);
  }

  handleChange(ev: Event) {
    //  { detail: { search: string } }
    // console.log(ev.detail.search);
  }

  handleSelected(cmd: Event) {
    // console.log(cmd);
  }
}

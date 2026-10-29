// SPIKE (throwaway, see branch spike/cmdk-palette)
import {Controller} from "@hotwired/stimulus"
import {pageCommandsStore, type PageCommand} from "../components/commandPaletteStore"

// Lives in each page's body (the layout renders it from `palette_commands`), so it connects on
// every Turbo visit and hands that page's commands to the one persistent palette.
export default class extends Controller<HTMLElement> {
  static values = {commands: Array}
  declare commandsValue: PageCommand[]

  connect() {
    pageCommandsStore.set(this.commandsValue || [])
  }

  disconnect() {
    pageCommandsStore.set([])
  }
}

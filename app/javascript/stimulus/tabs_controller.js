import {Tabs} from "tailwindcss-stimulus-components"

// The library's tabs, plus an opt-in memory: with `data-tabs-remember-key-value` set, the active
// tab is kept in localStorage under that key and restored when the controller connects. The
// content sidebar needs it because it sits inside the content frame and is rebuilt on every
// navigation. The tab is stored by id: documents and tables show different tabs, and a remembered
// one the current page lacks falls back to the first.
export default class TabsController extends Tabs {
  static values = {
    ...Tabs.values,
    rememberKey: String,
  }

  initialize() {
    super.initialize()

    const index = this.tabTargets.findIndex((tab) => tab.id === this.storedTab)
    if (index >= 0) this.indexValue = index
  }

  indexValueChanged() {
    super.indexValueChanged()
    this.storedTab = this.tabTargets[this.indexValue]?.id
  }

  get storedTab() {
    if (!this.rememberKeyValue) return null

    try {
      return localStorage.getItem(this.rememberKeyValue)
    } catch {
      return null
    }
  }

  set storedTab(id) {
    if (!this.rememberKeyValue || !id) return

    try {
      localStorage.setItem(this.rememberKeyValue, id)
    } catch {
      // Storage unavailable (private window, blocked): the tab just isn't remembered.
    }
  }
}

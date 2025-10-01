import {Multiselect} from "@wizardhealth/stimulus-multiselect";
export default class FixedMultiselect extends Multiselect {
  async searchRemote() {
    if (this.searchTarget.value === "") return

    const url = new URL(this.searchUrlValue, window.location.origin)
    url.searchParams.set("q", this.searchTarget.value)
    url.searchParams.set("preselects", this.selectedValue.map(x => x.value).join(","))

    const response = await fetch(url.toString())

    const searchedItems = await response.json()

    this.itemsValue = searchedItems
    this.dropdownTarget.classList.add("multiselect__dropdown--open")
  }

  async addable(e) {
    e.preventDefault()
    const query = this.searchTarget.value

    if (query === "" || this.itemsValue.some(item => item.text === query)) return

    const response = await fetch(this.addableUrlValue, {
      method: "POST",
      headers: {
        "X-CSRF-Token": document.querySelector("[name='csrf-token']").content,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ addable: query })
    })

    if (response.ok) {
      const addedItem = await response.json()

      this.addAddableItem(addedItem)
    }
  }
}
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
}
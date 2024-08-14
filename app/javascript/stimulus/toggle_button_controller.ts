import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="toggle-button"
export default class extends Controller<HTMLElement> {
  static targets = ["hideable"];
  static values = {
    checked: Boolean,
  }

  declare checkedValue: boolean;

  toggle() {
    this.checkedValue = !this.checkedValue;
  }

  checkedValueChanged() {
    this.dispatch("change", {detail: {value: this.checkedValue}});
  }

  /* leaving commented out, might become useful in future iterations
  example usage:
      this.#toggleDataAttributeList("ui", "checked");

  #toggleDataAttributeList(attributeName: string, valueToToggle: string) {
    const camelize = (s:string) => s.replace(/-./g, x=>x[1].toUpperCase());
    const camelizedAttributeName = camelize(attributeName);

    const prevValues = this.element.dataset[camelizedAttributeName]?.split(" ").filter(v => v !== "") || [];
    const nextValues = prevValues.includes(valueToToggle)
      ? prevValues.filter(value => value !== valueToToggle)
      : prevValues.concat(valueToToggle);
    this.element.dataset[camelizedAttributeName] = nextValues.join(" ");
  }
  */
}

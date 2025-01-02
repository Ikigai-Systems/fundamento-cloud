import {Controller} from "@hotwired/stimulus"
import Cookies from "js-cookie"

const COOKIE_NAME = "ikigai_userPreferences_showArchived";

// Connects to data-controller="toggle-button"
// 30-Dec-2024: actually, this controller should be renamed to "showArchivedToggleButton" or similar: it's not generic toggle-button
export default class extends Controller<HTMLElement> {
  static values = {
    checked: Boolean,
  }

  declare checkedValue: boolean;

  initialize() {
    this.checkedValue = (Cookies.get(COOKIE_NAME) === "true");
  }

  toggle() {
    this.checkedValue = !this.checkedValue;
  }

  checkedValueChanged() {
    this.dispatch("change", {detail: {value: this.checkedValue}});
    Cookies.set(COOKIE_NAME, this.checkedValue.toString());
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

import {Toggle} from "tailwindcss-stimulus-components"
import Cookies from "js-cookie";

export default class CookieManagedToggle extends Toggle {
  static values = {
    cookieKey: String
  }
  openValueChanged() {
    Cookies.set(this.cookieKeyValue, this.openValue.toString());
  }
}
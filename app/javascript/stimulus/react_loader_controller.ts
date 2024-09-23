import {Controller} from "@hotwired/stimulus"
import React from "react"
import ReactDOM, {Root} from "react-dom/client"
import {camelCase, deepConvertKeys} from "@js-from-routes/core";

// Connects to data-controller="react-loader"
export default class extends Controller<HTMLElement> {
  static values = {
    component: String,
    props: Object,
  }

  declare root: Root | undefined;
  declare propsValue: object;
  declare componentValue: string;

  async connect() {
    this._disconnectedAlready = false;
    const Component = await this.importComponent(); //while inside this await, 'disconnect' might occur in the meanwhile
    if (!this._disconnectedAlready) {
      this.root = ReactDOM.createRoot(this.element)
      this.root.render(React.createElement(Component, deepConvertKeys(this.propsValue, camelCase)));
    }
  }

  disconnect() {
    if (this.root) {
      this.root.unmount();
      this.root = undefined;
    }
    this._disconnectedAlready = true;
  }

  async importComponent() {
    const module = await import(`../components/${this.componentValue}.tsx`);
    return module.default;
  }
}

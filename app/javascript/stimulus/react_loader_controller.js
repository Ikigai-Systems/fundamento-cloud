import {Controller} from "@hotwired/stimulus"
import React from "react"
import ReactDOM from "react-dom/client"
import {camelCase, deepConvertKeys} from "@js-from-routes/core";

// Connects to data-controller="react-loader"
export default class extends Controller {
  static values = {
    component: String,
    props: Object,
  }

  async connect() {
    const Component = await this.importComponent();
    this.root = ReactDOM.createRoot(this.element)
    this.root.render(React.createElement(Component, deepConvertKeys(this.propsValue, camelCase)));
  }

  disconnect() {
    if (this.root) {
      this.root.unmount();
      this.root = undefined;
    }
  }

  async importComponent() {
    const module = await import(`../components/${this.componentValue}.tsx`);
    return module.default;
  }
}

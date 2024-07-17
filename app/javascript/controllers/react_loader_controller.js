import {Controller} from "@hotwired/stimulus"
import React from "react"
import ReactDOM from "react-dom/client"

// Connects to data-controller="react-loader"
export default class extends Controller {
  static values = {component: String}

  async connect() {
    const Component = await this.importComponent();
    this.root = ReactDOM.createRoot(this.element)
    this.root.render(React.createElement(Component));
  }

  disconnect() {
    this.root.unmount();
  }

  async importComponent() {
    const module = await import(`../components/${this.componentValue}`);
    return module.default;
  }
}

import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="show-if-input-value-equals"
export default class extends Controller<HTMLElement> {
  static targets = ['input', 'output']

  connect() {
    this.refresh();
  }

  refresh() {
    const inputValue = this.inputTarget.value;

    this.outputTargets.forEach(outputTarget => {
      const outputValue = outputTarget.dataset.showIfInputValueEquals;
      if (inputValue !== outputValue) {
        outputTarget.hidden = true;
      } else {
        outputTarget.hidden = false;
      }
    });
  }

  inputTargetConnected() {
    this.refresh();
  }

  inputTargetDisconnected() {
    this.refresh();
  }

  outputTargetConnected() {
    this.refresh();
  }

  outputTargetDisconnected() {
    this.refresh();
  }
}

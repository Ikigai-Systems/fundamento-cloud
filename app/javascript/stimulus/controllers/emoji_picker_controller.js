import { Controller } from "@hotwired/stimulus";
import { Picker } from "emoji-mart";
// import "emoji-mart/css/emoji-mart.css"; // Ensure this is imported to style the picker

export default class extends Controller {
  static targets = ["button", "pickerContainer", "emojiInput"];

  connect() {
    this.picker = null;
  }

  showPicker(event) {
    event.preventDefault();

    if (this.picker) {
      this.pickerContainerTarget.innerHTML = ""; // Clear the picker container
      this.picker = null;
    } else {
      this.picker = new Picker({
        onEmojiSelect: this.handleEmojiSelect.bind(this),
      });
      this.pickerContainerTarget.appendChild(this.picker); // Append the picker to the container
    }
  }

  handleEmojiSelect(emoji) {
    this.pickerContainerTarget.innerHTML = ""; // Clear the picker container
    this.picker = null;

    this.emojiInputTarget.value = emoji.native; // Set the hidden field value
    this.emojiInputTarget.dispatchEvent(new Event('change')); // Trigger the change event
  }
}
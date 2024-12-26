import { Controller } from "@hotwired/stimulus";
import { Picker } from "emoji-mart";
// import "emoji-mart/css/emoji-mart.css"; // Ensure this is imported to style the picker

export default class extends Controller {
  static targets = ["button", "pickerContainer"];

  connect() {
    this.picker = null;
  }

  showPicker(event) {
    event.preventDefault();

    if (this.picker) {
      this.pickerContainerTarget.innerHTML = "";
      this.picker = null;
    } else {
      this.picker = new Picker({
        onEmojiSelect: this.handleEmojiSelect.bind(this),
        autoFocus: true,
      });
      this.pickerContainerTarget.appendChild(this.picker);
    }
  }

  handleEmojiSelect(emoji) {
    this.picker.destroy();
    this.picker = null;

    fetch("/emojis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("meta[name='csrf-token']").content,
      },
      body: JSON.stringify({ emoji: emoji.native }),
    }).then((response) => {
      if (response.ok) {
        alert("Emoji sent successfully!");
      } else {
        alert("Failed to send emoji.");
      }
    });
  }
}
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["field"];
  static values = {
    editor: String
  };
    
  connect() {
    // Attach a submit listener to the form element
    this.element.addEventListener("submit", this.handleSubmit.bind(this));
  }

  handleSubmit() {
    const editorName = this.editorValue;
    const editor = window[editorName];

    if (editor && editor.document !== undefined) {
      // Serialize the BlockNote editor content to JSON
      const serializedContent = JSON.stringify(editor.document);
      // Assign the serialized content to the hidden field
      this.fieldTarget.value = serializedContent;
    } else {
      console.error(`Editor with window property "${editorName}" not found or missing document property.`);
    }
  }
}
import {Controller} from "@hotwired/stimulus"
import { get } from "@rails/request.js";
import UsersApi from "../../api/UsersApi.js";

export default class extends Controller {
  static targets = ["input", "select", "suggestions"]

  async search() {
    const query = this.inputTarget.value;

    if (query.length > 2) {
      const users = await UsersApi.suggestions({params: query});

      this.suggestionsTarget.innerHTML = '';

      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;

        // Create an interactive suggestion list to choose from
        const suggestion = document.createElement("div");
        suggestion.textContent = user.name;
        suggestion.dataset.action = "click->user-selector#addUser";
        suggestion.dataset.userId = user.id;

        this.suggestionsTarget.appendChild(suggestion);
      });
    }
  }

  addUser(event) {
    const userId = event.currentTarget.dataset.userId;

    // Add the selected user to the multiple select field
    const option = document.createElement("option");
    option.value = userId;
    option.textContent = event.currentTarget.textContent;
    option.selected = true;

    this.selectTarget.appendChild(option);
  }
}
import {Controller} from "@hotwired/stimulus";

export default class MultiselectNoopAddableController extends Controller {
  static targets = [ "multiselect" ];

  async addable(e) {
    console.log("Custom addable method called!", e)
    e.preventDefault()

    const multiselectController = this.application.getControllerForElementAndIdentifier(this.multiselectTarget, "multiselect");
    const addable = e.detail.addable
    
    multiselectController.addAddableItem({
      item: addable,
      value: addable,
    })
  }
}
import {Controller} from "@hotwired/stimulus"
import sortable from "html5sortable/dist/html5sortable.es.js"
import SpacesApi from "../api/SpacesApi.js"

// Connects to data-controller="draggable"
export default class extends Controller<HTMLElement> {
  declare element: HTMLElement;

  connect() {
    sortable([this.element], {
      placeholderClass: 'float-left bg-indigo-600 h-0.5 w-[268px] absolute before:absolute before:h-2 before:w-2 before:-top-[3px] before:border-2 before:border-solid before:rounded-full before:bg-white before:border-indigo-600'
    })[0].addEventListener('sortupdate', async (e) => {
      const spaceId = this.element.dataset.spaceId;
      const response = await SpacesApi.reorderHierarchy({params: {space_id: spaceId}, data: {id: spaceId, from: e.detail.origin.index, to: e.detail.destination.index}});
    });
  }

  disconnect() {
  }
}

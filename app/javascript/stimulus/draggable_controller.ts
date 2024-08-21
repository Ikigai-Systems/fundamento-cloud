import {Controller} from "@hotwired/stimulus"
import sortable from "html5sortable/dist/html5sortable.es.js"
import SpacesApi from "../api/SpacesApi.js"

// Connects to data-controller="draggable"
export default class extends Controller<HTMLElement> {
  static targets = ["item"];

  declare itemTargets: HTMLElement[];
  declare element: HTMLElement;

  connect() {
    const calculateDepth = element => {
      let accumulator = 0;
      while (element) {
        accumulator++;
        element = element.parentElement.closest("ul");
      }
      return accumulator;
    };

    const fixPlaceholderDepth = (container: HTMLElement) => {
      const placeholder: HTMLElement = container.querySelector('.sortable-placeholder');
      const containerDepth = calculateDepth(container);
      placeholder.style.marginLeft = `${16 * (containerDepth - 1)}px`;
      placeholder.style.width = `${268 - (16 * (containerDepth - 1))}px`;
    };

    sortable(this.itemTargets, {
      acceptFrom: '[data-draggable-target~="item"]',
      placeholderClass: 'sortable-placeholder float-left bg-indigo-600 h-0.5 w-[268px] absolute before:absolute before:h-2 before:w-2 before:-top-[3px] before:border-2 before:border-solid before:rounded-full before:bg-white before:border-indigo-600'
    }).forEach((item: HTMLElement) => {
      item.addEventListener('sortupdate', async (e: CustomEvent) => {
        e.detail.item.querySelector(".document-padding-left").style.paddingLeft = `${16 * (calculateDepth(e.detail.destination.container) - 1)}px`;

        const spaceId = this.element.dataset.spaceId;
        const response = await SpacesApi.reorderHierarchy({params: {space_id: spaceId}, data: {
          id: spaceId,
          documentId: e.detail.item.querySelector("div[data-document-id]").dataset.documentId,
          parentId: item.dataset.documentId,
          position: e.detail.destination.index}});
      });
      item.addEventListener('sortenter', (e: CustomEvent) => {
        fixPlaceholderDepth(e.detail.destination.container);
      });
      item.addEventListener('sortstart', (e: CustomEvent) => {
        const intervalId = setInterval(() => {
          if (e.detail.origin.container.querySelector('.sortable-placeholder')) {
            fixPlaceholderDepth(e.detail.origin.container);
            clearInterval(intervalId);
          }
        }, 10);
      });
    });
  }

  disconnect() {
  }
}

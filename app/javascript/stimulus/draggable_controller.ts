import {Controller} from "@hotwired/stimulus"
import sortable from "html5sortable/dist/html5sortable.es.js"
import SpacesApi from "../api/SpacesApi.js"

// Connects to data-controller="draggable"
export default class extends Controller<HTMLElement> {
  static targets = ["item"];

  declare itemTargets: HTMLElement[];
  declare element: HTMLElement;

  private readonly draggableSelector = '[data-controller~="draggable"]';

  connect() {
    let fixPlaceholderIntervalId = undefined;

    sortable(this.element, {
      // forcePlaceholderSize: true,
      acceptFrom: this.draggableSelector,
      // dropTargetContainerClass: 'bg-red-100',
      // placeholder: '<li class="bg-red-100"></li>',
      placeholderClass: 'sortable-placeholder float-left bg-indigo-600 h-0.5 w-[268px] data-[surround=true]:before:hidden absolute before:absolute before:h-2 before:w-2 before:-top-[3px] before:border-2 before:border-solid before:rounded-full before:bg-white before:border-indigo-600'
    }).forEach((item: HTMLElement) => {
      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortupdate
      // This event is triggered when the user stopped sorting and the DOM position has changed.
      item.addEventListener('sortupdate', async (e: CustomEvent) => {
        e.detail.item.querySelectorAll(".document-padding-left").forEach(element => {
          element.style.paddingLeft = `${16 * (this.calculateDepth(element.closest("ul")) - 1)}px`;
        });

        const container = e.detail.destination.container;
        container.classList.remove("h-[37px]", "mb-[-37px]", "top-[-37px]");

        const closestCollapsible = container.closest("[data-controller~='collapsible']");
        if (closestCollapsible) {
          closestCollapsible.dataset.collapsibleCollapsedValue = "false";
        }

        const spaceId = this.element.dataset.spaceId;

        await SpacesApi.reorderHierarchy({
          params: {id: spaceId},
          data: {
            documentId: e.detail.item.querySelector("div[data-document-id]").dataset.documentId,
            parentId: item.dataset.documentId,
            position: e.detail.destination.index
          }
        });
      });

      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortstart
      // This event is triggered when the user starts sorting and the DOM position has not yet changed.
      item.addEventListener('sortstart', (e: CustomEvent) => {
        fixPlaceholderIntervalId = setInterval(() => {
          this.updatePlaceholder();
        }, 10)

        setTimeout(() => {
          // Initially all empty sortable containers have height 0px, so we need to fix that to make it possible to drag items into them.

          // this.itemTargets.forEach(container => {
          document.querySelectorAll(this.draggableSelector).forEach(container => {
            console.log(`Fixing container ${container.children.length}`, container);

            // debugger;
            if (container.children.length === 0) {
              // element.style.backgroundColor = "red";
              // element.style.opacity = "70%";
              container.style.maxHeight = "inherit";
              container.style.height = "19px";
              container.style.position = "relative";
              container.style.top = "-23px";
              container.style.marginBottom = "-19px";
              container.style.overflow = "visible";
            }
          });
        }, 10)
      });

      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortstop
      // This event is triggered when the user stops sorting and the DOM position has not yet changed.
      item.addEventListener('sortstop', (e: CustomEvent) => {
        clearInterval(fixPlaceholderIntervalId);

        // this.itemTargets.forEach(container => {
        document.querySelectorAll(this.draggableSelector).forEach(container => {
          const li = container.closest("li");
          if (li) {
            const expanderIcon = li.querySelector(".multi-items-expander");
            const dotIcon = li.querySelector(".single-item-dot");

            if (container.children.length >= 1) {
              expanderIcon.classList.remove("hidden");
              dotIcon.classList.add("hidden");
            } else {
              expanderIcon.classList.add("hidden");
              dotIcon.classList.remove("hidden");
            }
          }

          container.style.backgroundColor = "";
          container.style.maxHeight = "";
          container.style.height = "";
          container.style.position = "";
          container.style.top = "";
          container.style.marginBottom = "";
          container.style.opacity = "";
          container.style.overflow = "";
        });
      });
    });
  }

  private calculateDepth(element: HTMLElement): number {
    let accumulator = 0;
    while (element) {
      accumulator++;
      element = element.parentElement.closest(this.draggableSelector);
    }
    return accumulator;
  }
  
  private updatePlaceholder() {
    const placeholder: HTMLElement = document.querySelector('.sortable-placeholder');

    if (!placeholder) return;

    const container = placeholder.closest(this.draggableSelector);
    const containerDepth = this.calculateDepth(container);

    if (container.querySelectorAll("li:not(.sortable-placeholder)").length === 0) {
      placeholder.style.height = "35px";
      placeholder.style.top = "-13px";
      placeholder.style.border = "solid 2px rgb(79 70 229)"; //bg-indigo-600
      placeholder.style.borderRadius = "8px";
      placeholder.style.backgroundColor = "inherit";
      placeholder.dataset.surround = "true";
      placeholder.style.marginLeft = "";
      placeholder.style.width = "";
    } else {
      placeholder.style.marginLeft = `${16 * (containerDepth - 1)}px`;
      placeholder.style.width = `${268 - (16 * (containerDepth - 1))}px`;
      placeholder.dataset.surround = "false";
      placeholder.style.height = "";
      placeholder.style.top = "";
      placeholder.style.border = "";
      placeholder.style.borderRadius = "";
      placeholder.style.backgroundColor = "";
    }
  }
}
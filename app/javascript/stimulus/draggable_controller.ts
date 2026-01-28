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
    let updatePlaceholderInterval = undefined;

    sortable(this.element, {
      acceptFrom: this.draggableSelector,
      placeholderClass: 'sortable-placeholder'
    }).forEach((item: HTMLElement) => {
      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortupdate
      // This event is triggered when the user stopped sorting and the DOM position has changed.
      item.addEventListener('sortupdate', async (e: CustomEvent) => {
        // Update level for all nested items after drop
        e.detail.item.querySelectorAll(".document-padding-left").forEach(element => {
          const level = this.calculateDepth(element.closest("ul")) - 1;
          element.style.setProperty("--level", level.toString());
        });

        // Auto-expand destination container if it has collapsible controller
        const container = e.detail.destination.container;
        const closestCollapsible = container.closest("[data-controller~='collapsible']") as HTMLElement;
        if (closestCollapsible) {
          const controller = this.application.getControllerForElementAndIdentifier(
            closestCollapsible,
            "collapsible"
          ) as any;
          controller?.expand();
        }

        // Persist the reorder to the backend
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
        // Continuously update placeholder state during drag
        updatePlaceholderInterval = setInterval(() => {
          this.updatePlaceholder();
        }, 10);

        // Mark empty containers so they can accept drops (CSS will style them)
        setTimeout(() => {
          document.querySelectorAll(this.draggableSelector).forEach(container => {
            const isEmpty = container.children.length === 0;

            (container as HTMLElement).dataset.draggableEmpty = isEmpty.toString();
          });
        }, 10);
      });

      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortstop
      // This event is triggered when the user stops sorting and the DOM position has not yet changed.
      item.addEventListener('sortstop', (e: CustomEvent) => {
        clearInterval(updatePlaceholderInterval);

        // Update has-children state and clean up empty markers
        document.querySelectorAll(this.draggableSelector).forEach(container => {
          const hasChildren = container.children.length > 0;
          const li = container.closest("li") as HTMLElement;

          if (li) {
            // Update Stimulus value - will automatically update hasChildrenValue in collapsible controller
            li.dataset.collapsibleHasChildrenValue = hasChildren.toString();
          }

          // Clean up drag state
          delete (container as HTMLElement).dataset.draggableEmpty;
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
    const level = containerDepth - 1;

    // Set level for CSS to calculate indentation
    placeholder.style.setProperty("--level", level.toString());

    // Mark whether placeholder is surrounding an empty container (CSS handles styling)
    const isEmpty = container.querySelectorAll("li:not(.sortable-placeholder)").length === 0;
    placeholder.dataset.surround = isEmpty.toString();
  }
}
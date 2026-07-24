import {Controller} from "@hotwired/stimulus"
import sortable from "html5sortable/dist/html5sortable.es.js"
import SpacesApi from "../api/SpacesApi.js"

// Shape of the `detail` payload dispatched by html5sortable's `sortupdate` event.
// See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortupdate
interface SortUpdateDetail {
  item: HTMLElement;
  destination: {
    container: HTMLElement;
    index: number;
  };
}

// Connects to data-controller="draggable"
export default class extends Controller<HTMLElement> {
  static targets = ["item"];

  declare itemTargets: HTMLElement[];

  private readonly draggableSelector = '[data-controller~="draggable"]';

  connect() {
    let updatePlaceholderInterval: ReturnType<typeof setInterval> | undefined = undefined;

    sortable(this.element, {
      acceptFrom: this.draggableSelector,
      placeholderClass: 'sortable-placeholder'
    }).forEach((item: HTMLElement) => {
      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortupdate
      // This event is triggered when the user stopped sorting and the DOM position has changed.
      item.addEventListener('sortupdate', async (event: Event) => {
        const detail = (event as CustomEvent<SortUpdateDetail>).detail;

        // Update level for all nested items after drop
        detail.item.querySelectorAll<HTMLElement>(".document-padding-left").forEach(element => {
          const level = this.calculateDepth(element.closest("ul")) - 1;
          element.style.setProperty("--level", level.toString());
        });

        // Auto-expand destination container if it has collapsible controller
        const container = detail.destination.container;
        const closestCollapsible = container.closest("[data-controller~='collapsible']");
        if (closestCollapsible instanceof HTMLElement) {
          const controller = this.application.getControllerForElementAndIdentifier(
            closestCollapsible,
            "collapsible"
          ) as (Controller & {expand(): void}) | null;
          controller?.expand();
        }

        // Persist the reorder to the backend
        const spaceId = this.element.dataset.spaceId;
        const documentElement = detail.item.querySelector<HTMLElement>("div[data-document-id]");

        await SpacesApi.reorderHierarchy({
          params: {id: spaceId},
          data: {
            documentId: documentElement?.dataset.documentId,
            parentId: item.dataset.documentId,
            position: detail.destination.index
          }
        });
      });

      // See https://github.com/lukasoppermann/html5sortable?tab=readme-ov-file#sortstart
      // This event is triggered when the user starts sorting and the DOM position has not yet changed.
      item.addEventListener('sortstart', () => {
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
      item.addEventListener('sortstop', () => {
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

  private calculateDepth(element: Element | null): number {
    let accumulator = 0;
    let current = element;
    while (current) {
      accumulator++;
      current = current.parentElement?.closest(this.draggableSelector) ?? null;
    }
    return accumulator;
  }

  private updatePlaceholder() {
    const placeholder = document.querySelector<HTMLElement>('.sortable-placeholder');

    if (!placeholder) return;

    const container = placeholder.closest(this.draggableSelector);
    const containerDepth = this.calculateDepth(container);
    const level = containerDepth - 1;

    // Set level for CSS to calculate indentation
    placeholder.style.setProperty("--level", level.toString());

    // Mark whether placeholder is surrounding an empty container (CSS handles styling)
    const isEmpty = container === null
      || container.querySelectorAll("li:not(.sortable-placeholder)").length === 0;
    placeholder.dataset.surround = isEmpty.toString();
  }
}
// The html5sortable ES bundle ships without type declarations. This ambient
// module describes the subset of its API used across the app.
declare module "html5sortable/dist/html5sortable.es.js" {
  interface SortableConfiguration {
    acceptFrom?: string;
    placeholderClass?: string;
  }

  interface Sortable {
    (element: HTMLElement, options?: SortableConfiguration): HTMLElement[];
    // Tears the sortable down and drops the element (and its items) from the library's
    // module-level `stores` Map, which nothing else ever clears.
    destroy(element: HTMLElement): void;
  }

  const sortable: Sortable;

  export default sortable;
}

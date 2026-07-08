// The html5sortable ES bundle ships without type declarations. This ambient
// module describes the subset of its API used across the app.
declare module "html5sortable/dist/html5sortable.es.js" {
  interface SortableConfiguration {
    acceptFrom?: string;
    placeholderClass?: string;
  }

  function sortable(element: HTMLElement, options?: SortableConfiguration): HTMLElement[];

  export default sortable;
}

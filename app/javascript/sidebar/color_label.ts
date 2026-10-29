import type {ColorName} from "../types.js";

// Underlines an element's text in the object's colour, or clears it. See color_label.css.
export function applyColorLabel(element: HTMLElement, color?: ColorName | null): void {
  if (color) {
    element.classList.add("color-label");
    element.dataset.color = color;
  } else {
    element.classList.remove("color-label");
    delete element.dataset.color;
  }
}

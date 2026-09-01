import {ObjectIcon} from "./types"

// The client mirror of the ObjectIcon view component (app/components/object_icon.rb).
//
// The component always renders one <span class="object-icon"> slot, holding
// either the icon's value as text or the object type's default Font Awesome <i>.
// Which glyph that is stays in Ruby -- it rides along in data-fallback-icon -- so
// renaming an object can swap the slot in either direction without the client
// knowing anything about object types.
export function applyObjectIcon(container: Element, icon?: ObjectIcon | null): void {
  const slot = container.querySelector<HTMLElement>(":scope > .object-icon");
  if (!slot) return;

  if (icon) {
    // Text, never markup: a title is user input.
    slot.textContent = icon.value;
    return;
  }

  const glyph = document.createElement("i");
  glyph.className = slot.dataset.fallbackIcon ?? "";
  slot.replaceChildren(glyph);
}

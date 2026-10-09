import Popover from "@stimulus-components/popover"

// A hover hint (a control's name, its keyboard shortcut) for pointers that can hover and for
// keyboard focus, never for a finger.
//
// Wire it with `pointerenter->tooltip#show pointerleave->tooltip#hide focusin->tooltip#show
// focusout->tooltip#hide`. Pointer events say which pointer it was. A tap on a touch screen
// still sends `mouseenter` for compatibility, with nothing to tell it apart from a mouse, and
// only takes it back on the next tap elsewhere — a tooltip wired to it sticks after every tap.
//
// Popovers whose content is the point (who reacted, the rest of an avatar list) stay on the
// `popover` controller: hiding them from touch would make their content unreachable.
export default class TooltipController extends Popover {
  show(event) {
    if (event.type === "pointerenter" && event.pointerType !== "mouse") return
    // A tap focuses a button on some touch browsers; only keyboard focus shows a hint
    if (event.type === "focusin" && !event.target.matches(":focus-visible")) return

    // Re-entering while shown (focus then hover) must not stack a second card
    this.hide()
    return super.show(event)
  }
}

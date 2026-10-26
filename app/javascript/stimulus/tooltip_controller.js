import FixedPopover from "./popover_controller.js"

// A hover hint (a control's name, its keyboard shortcut) for pointers that can hover and for
// keyboard focus, never for a finger.
//
// Wire it with `pointerenter->tooltip#show pointerleave->tooltip#hide focusin->tooltip#show
// focusout->tooltip#hide`. Pointer events say which pointer it was. A tap on a touch screen
// still sends `mouseenter` for compatibility, with nothing to tell it apart from a mouse, and
// only takes it back on the next tap elsewhere — a tooltip wired to it sticks after every tap.
//
// Popovers whose content is the point must not be hidden from touch: the rest of an avatar list
// opens with a tap through `disclosure-popover`; who reacted is still on the `popover` controller.
// The tooltip and the popover share FixedPopover, so neither stacks a second card when re-entered
// while shown.
export default class TooltipController extends FixedPopover {
  show(event) {
    if (event.type === "pointerenter" && event.pointerType !== "mouse") return
    // A tap focuses a button on some touch browsers; only keyboard focus shows a hint
    if (event.type === "focusin" && !event.target.matches(":focus-visible")) return

    return super.show(event)
  }
}

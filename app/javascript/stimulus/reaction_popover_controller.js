import FixedPopover from "./popover_controller.js"

const LONG_PRESS_MS = 500
// A finger drifts a little while held; more than this is a scroll, not a press
const MOVE_TOLERANCE_PX = 10

// Who reacted with an emoji. A mouse shows it on hover, keyboard focus shows it too.
//
// A finger can't hover, and a tap on your own reaction removes it, so on touch a long press shows
// the list instead and the tap that ends it changes nothing. A tap on someone else's reaction, which
// a tap can't change, shows the list straight away. A tap outside or Escape closes it.
//
// Usage:
//   <div data-controller="reaction-popover" data-reaction-popover-url-value="..."
//        data-action="pointerenter->reaction-popover#enter pointerleave->reaction-popover#leave
//                     pointerdown->reaction-popover#press pointermove->reaction-popover#move
//                     pointerup->reaction-popover#release pointercancel->reaction-popover#release
//                     click->reaction-popover#click:capture contextmenu->reaction-popover#contextmenu
//                     focusin->reaction-popover#focus focusout->reaction-popover#hide
//                     pointerdown@document->reaction-popover#closeOutside
//                     keydown.esc@document->reaction-popover#hide">
//     <button data-reaction-popover-target="button">👍 2</button>
//   </div>
export default class ReactionPopoverController extends FixedPopover {
  static targets = ["button"]

  disconnect() {
    this.cancelPress()
  }

  enter(event) {
    if (event.pointerType === "mouse") this.open()
  }

  leave(event) {
    if (event.pointerType === "mouse") this.hide()
  }

  press(event) {
    this.pointerType = event.pointerType
    this.longPressed = false
    if (event.pointerType === "mouse") return

    this.cancelPress()
    this.pressedAt = { x: event.clientX, y: event.clientY }
    this.pressTimer = setTimeout(() => {
      this.pressTimer = null
      this.longPressed = true
      this.open()
    }, LONG_PRESS_MS)
  }

  move(event) {
    if (!this.pressTimer) return

    const dx = event.clientX - this.pressedAt.x
    const dy = event.clientY - this.pressedAt.y
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) this.cancelPress()
  }

  release() {
    this.cancelPress()
  }

  click(event) {
    // The press already did its job: don't also remove the reaction
    if (this.longPressed) {
      event.preventDefault()
      event.stopPropagation()
      this.longPressed = false
      return
    }

    if (this.buttonTarget.disabled) {
      if (this.pointerType !== "mouse") this.open()
    } else {
      // The reaction is about to change; the list would describe the old one
      this.hide()
    }
  }

  // Android opens the context menu on a long press
  contextmenu(event) {
    if (this.pointerType !== "mouse") event.preventDefault()
  }

  // A tap focuses a button on some touch browsers; only keyboard focus shows the list
  focus(event) {
    if (event.target.matches(":focus-visible")) this.open()
  }

  closeOutside(event) {
    if (!this.element.contains(event.target)) this.hide()
  }

  open() {
    if (this.hasCardTarget) return

    return this.show({ currentTarget: this.element })
  }

  cancelPress() {
    clearTimeout(this.pressTimer)
    this.pressTimer = null
  }
}

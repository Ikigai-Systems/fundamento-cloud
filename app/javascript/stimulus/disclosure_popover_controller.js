import { Controller } from "@hotwired/stimulus"

// A popover whose content is the point (the rest of an avatar list), not a hint: everyone must be
// able to open it. A mouse opens it by hovering. A tap, a click or Enter / Space on its button
// toggles it, and then it stays until a tap outside, Escape or another toggle.
//
// A finger can't hover, and a tap still sends a compatibility `mouseenter`, so a popover wired to
// it opens by accident and stays stuck until the next tap elsewhere. Pointer events tell the two
// apart. The timestamp popup works the same way (timestamp_controller.ts).
//
//   <div data-controller="disclosure-popover"
//        data-action="pointerenter->disclosure-popover#enter pointerleave->disclosure-popover#leave
//                     pointerdown@document->disclosure-popover#closeOutside
//                     keydown.esc@document->disclosure-popover#escape">
//     <button data-disclosure-popover-target="button" aria-expanded="false"
//             data-action="disclosure-popover#toggle">…</button>
//     <template data-disclosure-popover-target="content">…</template>
//   </div>
export default class DisclosurePopoverController extends Controller {
  static targets = ["button", "content"]

  disconnect() {
    this.close()
  }

  enter(event) {
    if (event.pointerType !== "mouse") return

    this.open()
  }

  leave(event) {
    if (event.pointerType !== "mouse" || this.pinned) return

    this.close()
  }

  // A hover may already have opened it: the click then keeps it open rather than closing it
  toggle() {
    if (this.card && this.pinned) {
      this.close()
    } else {
      this.open()
      this.pinned = true
    }
  }

  closeOutside(event) {
    if (!this.card || this.element.contains(event.target)) return

    this.close()
  }

  escape() {
    if (!this.card) return

    this.close()
    this.buttonTarget.focus()
  }

  open() {
    if (this.card) return

    this.element.appendChild(this.contentTarget.content.cloneNode(true))
    this.card = this.element.lastElementChild
    this.buttonTarget.setAttribute("aria-expanded", "true")
  }

  close() {
    this.card?.remove()
    this.card = null
    this.pinned = false
    if (this.hasButtonTarget) this.buttonTarget.setAttribute("aria-expanded", "false")
  }
}

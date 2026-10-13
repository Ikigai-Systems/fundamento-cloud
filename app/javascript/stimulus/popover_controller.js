import Popover from "@stimulus-components/popover"

// The stimulus-components popover appends a fresh card on every show, so re-entering while it is
// shown (focus then hover, or a second mouseenter) stacks a second card. Hiding first keeps one.
export default class FixedPopover extends Popover {
  show(event) {
    super.hide()
    return super.show(event)
  }
}

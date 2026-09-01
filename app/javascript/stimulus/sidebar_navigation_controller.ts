import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

// Navigates the "content" frame from links that live inside the sidebar's tab frames.
//
// Turbo cannot do this on its own: a link inside the nested "hierarchy_sidebar_tab" frame that
// targets "content" is claimed by neither frame — the content frame's LinkInterceptor only acts
// on clicks whose closest ancestor frame is itself, and the tab frame refuses a link aimed
// elsewhere. With no frame interception the session-level observer takes over and does a full
// page visit, which reloads the whole layout, sidebar included. Intercepting the click here,
// before it bubbles to the window, keeps the navigation inside the content frame.
export default class extends Controller<HTMLElement> {
  navigate(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0) return
    // Let the browser handle open-in-new-tab/window and download modifiers.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-turbo-frame]")
    if (!link || !this.element.contains(link)) return
    if (link.target && link.target !== "_self") return

    const frame = link.dataset.turboFrame
    if (!frame || frame === "_top" || frame === "_self") return

    event.preventDefault()
    event.stopPropagation()
    Turbo.visit(link.href, { frame })
  }
}

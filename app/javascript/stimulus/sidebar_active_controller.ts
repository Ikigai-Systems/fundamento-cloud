import {Controller} from "@hotwired/stimulus"

// Updates the selected state of sidebar items after content frame navigation,
// since the sidebar itself is not reloaded between document/table navigations.
export default class extends Controller<HTMLElement> {
  private frameLoadHandler!: (event: Event) => void

  connect() {
    this.frameLoadHandler = (event: Event) => {
      const frame = event.target as HTMLElement
      if (frame.id !== "content") return
      this.updateActiveState()
    }
    document.addEventListener("turbo:frame-load", this.frameLoadHandler)
  }

  disconnect() {
    document.removeEventListener("turbo:frame-load", this.frameLoadHandler)
  }

  private updateActiveState() {
    const currentPath = window.location.pathname

    this.element.querySelectorAll<HTMLElement>(".content-link-container").forEach((container) => {
      const link = container.querySelector<HTMLAnchorElement>("a.content-link")
      if (!link) return
      const linkPath = new URL(link.href, window.location.origin).pathname
      // Prefix match on a path boundary, so /d/two also matches /d/two/edit and
      // /d/two/versions (draft documents redirect from /d/X to /d/X/edit).
      const isSelected = currentPath === linkPath || currentPath.startsWith(linkPath + "/")
      container.classList.toggle("selected", isSelected)
    })

    const selected = this.element.querySelector<HTMLElement>(".content-link-container.selected")
    selected?.scrollIntoView({block: "nearest", behavior: "smooth"})
  }
}

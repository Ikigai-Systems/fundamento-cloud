import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

// Intercepts clicks on .content-link elements in the sidebar and navigates
// the content frame directly via Turbo.visit, bypassing Turbo's frame
// interception which cannot handle links inside nested turbo frames that
// target a different frame (content) outside their ancestor chain.
export default class extends Controller<HTMLElement> {
  navigate(event: MouseEvent) {
    const link = (event.target as Element).closest<HTMLAnchorElement>("a.content-link")
    if (!link) return

    event.preventDefault()
    event.stopPropagation()
    Turbo.visit(link.href, { frame: "content" })
  }
}

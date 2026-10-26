import { Controller } from "@hotwired/stimulus"
import escapeHtml from "../../utils/escapeHtml"

type FlashOptions = {
  type?: "notice" | "alert" | "error"
  message: string
  key?: string
  replacePrevious?: boolean
}

// Long enough to read a one-line confirmation; hovering or focusing it holds it open.
// A notice that never closed sat over the content on a phone until hit with the small ×.
const NOTICE_DISMISS_MS = 3000

export default class extends Controller<HTMLElement> {
  static targets = ["pending"]

  declare pendingTargets: HTMLElement[]

  // Fires on initial connect for server-rendered elements, AND when new
  // pending elements arrive later (e.g. appended via turbo-stream after a
  // frame swap). Stimulus uses a MutationObserver under the hood.
  pendingTargetConnected(el: HTMLElement) {
    const options: FlashOptions = {
      type: (el.dataset.flashType as FlashOptions["type"]) || "notice",
      message: el.dataset.flashMessage || "",
      key: el.dataset.flashKey,
      replacePrevious: el.dataset.flashReplacePrevious === "true",
    }

    // Remove the pending marker before dedup so it can't match its own key.
    el.remove()

    this.show(options)
  }

  // Public method called from createFlash.ts or via Stimulus actions
  show(options: FlashOptions) {
    // Handle deduplication. Iterate children rather than querySelector so the
    // key can be any string (including server-rendered message text with
    // characters that would need CSS escaping).
    if (options.key) {
      const existing = Array.from(this.element.children).find((child): child is HTMLElement => {
        return child instanceof HTMLElement && child.dataset.flashKey === options.key
      })
      if (existing) {
        if (options.replacePrevious) {
          existing.remove()
        } else {
          return // Skip duplicate
        }
      }
    }

    const flashElement = this.createFlashElement(options)
    this.element.appendChild(flashElement)
    if (flashElement.dataset.flashType === "notice") this.dismissLater(flashElement)
  }

  // Notices are confirmations and close themselves; alerts and errors wait for the user.
  // The countdown stops while the notice is hovered or focused and starts over when left,
  // so it never closes under someone reading it or about to press its close button.
  private dismissLater(flash: HTMLElement) {
    let timer: number | undefined
    let hovered = false
    let focused = false
    const start = () => {
      window.clearTimeout(timer)
      if (hovered || focused) return
      timer = window.setTimeout(() => {
        if (!flash.isConnected) return
        const alert = this.application.getControllerForElementAndIdentifier(flash, "alert") as { close(): void } | null
        if (alert) alert.close()
        else flash.remove()
      }, NOTICE_DISMISS_MS)
    }
    flash.addEventListener("mouseenter", () => { hovered = true; start() })
    flash.addEventListener("mouseleave", () => { hovered = false; start() })
    flash.addEventListener("focusin", () => { focused = true; start() })
    flash.addEventListener("focusout", (event) => {
      if (flash.contains(event.relatedTarget as Node | null)) return
      focused = false
      start()
    })
    start()
  }

  private createFlashElement(options: FlashOptions): HTMLElement {
    // Map legacy types for backwards compatibility
    let type = options.type || "notice"
    const typeStr = type as string
    if (typeStr === "info" || typeStr === "warning" || typeStr === "success") {
      if (typeStr === "info" || typeStr === "success") {
        type = "notice"
      } else {
        type = "alert"
      }
    }

    // Build HTML directly in TypeScript (single source of truth).
    // NOTE: do NOT interpolate options.key (or any user-supplied string) into
    // the template — set it via setAttribute below after parsing. The key is
    // server-rendered from the flash message text, which can contain quotes
    // or HTML metacharacters.
    const html = `
      <div data-controller="alert"
           data-flash-type="${type}"
           data-transition-enter="transition ease-out duration-300"
           data-transition-enter-from="opacity-0 -translate-y-2"
           data-transition-enter-to="opacity-100 translate-y-0"
           data-transition-leave="transition ease-in duration-200"
           data-transition-leave-from="opacity-100 translate-y-0"
           data-transition-leave-to="opacity-0 -translate-y-2"
           class="w-full max-w-sm opacity-0 -translate-y-2">
        <div class="relative pointer-events-auto flash-${type}-container border-t-4 rounded-b px-4 py-3 shadow-md">
          <div class="flex items-start">
            <div class="py-1">
              <span class="icon-[tabler--info-circle] block size-6 shrink-0 flash-${type}-icon mr-4" aria-hidden="true"></span>
            </div>
            <div class="w-0 flex-1">
              <p class="font-bold">Heads up!</p>
              <p class="text-sm">${escapeHtml(options.message)}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button data-action="alert#close" class="inline-flex p-1 -m-1 flash-${type}-button focus:outline-none focus:text-gray-300 transition ease-in-out duration-150" aria-label="Close">
                <span class="icon-[tabler--x] size-5" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    const temp = document.createElement("div")
    temp.innerHTML = html.trim()
    const element = temp.firstElementChild as HTMLElement
    if (options.key) {
      element.dataset.flashKey = options.key
    }
    return element
  }
}

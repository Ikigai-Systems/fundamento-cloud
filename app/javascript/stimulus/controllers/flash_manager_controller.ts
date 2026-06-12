import { Controller } from "@hotwired/stimulus"

type FlashOptions = {
  type?: "notice" | "alert" | "error"
  message: string
  duration?: "short"
  key?: string
  replacePrevious?: boolean
}

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
      duration: el.dataset.flashDuration as FlashOptions["duration"],
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
    // Map duration to milliseconds
    const durationMs = options.duration === "short" ? 3000 : undefined
    const autoDismissAttr = durationMs
      ? `data-alert-dismiss-after-value="${durationMs}"`
      : ""

    // Build HTML directly in TypeScript (single source of truth).
    // NOTE: do NOT interpolate options.key (or any user-supplied string) into
    // the template — set it via setAttribute below after parsing. The key is
    // server-rendered from the flash message text, which can contain quotes
    // or HTML metacharacters.
    const html = `
      <div data-controller="alert"
           ${autoDismissAttr}
           data-transition-enter="transition-position ease-in-out duration-500"
           data-transition-enter-from="left-96"
           data-transition-enter-to="-left-8"
           data-transition-leave="transition-position ease-in-out duration-500"
           data-transition-leave-from="-left-8"
           data-transition-leave-to="left-96"
           class="w-full flex items-end justify-right [&:nth-child(n+2)]:mt-2 first:mt-10 justify-end z-50 pointer-events-none relative left-96">
        <div class="max-w-sm w-full relative pointer-events-auto flash-${type}-container border-t-4 rounded-b px-4 py-3 shadow-md">
          <div class="flex items-start">
            <div class="py-1">
              <svg class="fill-current h-6 w-6 flash-${type}-icon mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div class="w-0 flex-1">
              <p class="font-bold">Heads up!</p>
              <p class="text-sm">${this.escapeHtml(options.message)}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button data-action="alert#close" class="inline-flex flash-${type}-button focus:outline-none focus:text-gray-300 transition ease-in-out duration-150" aria-label="Close">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
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

  private escapeHtml(text: string): string {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

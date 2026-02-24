import { Controller } from "@hotwired/stimulus"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export default class TimestampController extends Controller {
  static values = {
    datetime: String,
  }

  declare datetimeValue: string
  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  connect(): void {
    this.element.classList.add("cursor-default")
    this.element.addEventListener("mouseenter", this.handleMouseEnter)
    this.element.addEventListener("mouseleave", this.handleMouseLeave)
  }

  disconnect(): void {
    this.element.removeEventListener("mouseenter", this.handleMouseEnter)
    this.element.removeEventListener("mouseleave", this.handleMouseLeave)
    this.removePopup()
    if (this.hideTimeout) clearTimeout(this.hideTimeout)
  }

  private handleMouseEnter = (): void => {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }

    // Remove existing popup if any
    this.removePopup()
    this.showPopup()
  }

  private handleMouseLeave = (): void => {
    this.hideTimeout = setTimeout(() => {
      this.removePopup()
    }, 150)
  }

  private showPopup(): void {
    const parsed = dayjs(this.datetimeValue)
    const utcTime = parsed.utc()

    const localFormatted = parsed.format("ddd, MMM D, YYYY h:mm:ss A")
    const utcFormatted = utcTime.format("ddd, MMM D, YYYY h:mm:ss A")

    const offsetMinutes = new Date().getTimezoneOffset()
    const totalMinutes = -offsetMinutes
    const hours = Math.floor(Math.abs(totalMinutes) / 60)
    const minutes = Math.abs(totalMinutes) % 60
    const sign = totalMinutes >= 0 ? "+" : "-"
    const offsetLabel = minutes > 0
      ? `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`
      : `UTC${sign}${hours}`

    const popup = document.createElement("div")
    popup.setAttribute("data-timestamp-popup", "")
    popup.className = "fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm whitespace-nowrap"
    popup.addEventListener("mouseenter", () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout)
        this.hideTimeout = null
      }
    })
    popup.addEventListener("mouseleave", () => {
      this.hideTimeout = setTimeout(() => {
        this.removePopup()
      }, 150)
    })

    popup.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span class="icon-[heroicons--computer-desktop] size-4 shrink-0"></span>
            <span class="font-medium">Your device</span>
            <span class="text-xs text-gray-400">${offsetLabel}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-900 dark:text-gray-100">${localFormatted}</span>
            <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" data-copy-value="${localFormatted}" data-action="click->timestamp#copyValue">
              <span class="icon-[heroicons--clipboard] size-4"></span>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span class="icon-[heroicons--globe-alt] size-4 shrink-0"></span>
            <span class="font-medium">UTC</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-900 dark:text-gray-100">${utcFormatted}</span>
            <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" data-copy-value="${utcFormatted}" data-action="click->timestamp#copyValue">
              <span class="icon-[heroicons--clipboard] size-4"></span>
            </button>
          </div>
        </div>
      </div>
    `

    // Append to body with fixed positioning to escape sidebar overflow clipping
    document.body.appendChild(popup)

    // Position relative to trigger element
    const rect = this.element.getBoundingClientRect()
    const popupRect = popup.getBoundingClientRect()

    // Position above the trigger, aligned to the right edge
    let top = rect.top - popupRect.height - 8
    let left = rect.right - popupRect.width

    // If it would go above the viewport, show below instead
    if (top < 8) {
      top = rect.bottom + 8
    }

    // Keep within viewport horizontally
    if (left < 8) {
      left = 8
    }

    popup.style.top = `${top}px`
    popup.style.left = `${left}px`
  }

  private removePopup(): void {
    const popup = document.querySelector("[data-timestamp-popup]")
    if (popup) popup.remove()
  }

  copyValue(event: Event): void {
    const button = (event.currentTarget as HTMLElement)
    const value = button.getAttribute("data-copy-value")
    if (!value) return

    navigator.clipboard.writeText(value).then(() => {
      const icon = button.querySelector("span")
      if (icon) {
        icon.className = "icon-[heroicons--check] size-4 text-green-500"
        setTimeout(() => {
          icon.className = "icon-[heroicons--clipboard] size-4"
        }, 1500)
      }
    }).catch(() => {
      // Clipboard API may not be available in all contexts
    })
  }
}

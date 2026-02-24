import Popover from "@stimulus-components/popover"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export default class TimestampController extends Popover {
  static values = {
    datetime: String,
  }

  declare datetimeValue: string
  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  connect(): void {
    this.element.classList.add("relative", "cursor-default")
    this.element.addEventListener("mouseenter", this.handleMouseEnter)
    this.element.addEventListener("mouseleave", this.handleMouseLeave)
  }

  disconnect(): void {
    this.element.removeEventListener("mouseenter", this.handleMouseEnter)
    this.element.removeEventListener("mouseleave", this.handleMouseLeave)
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
    const offsetHours = -offsetMinutes / 60
    const offsetSign = offsetHours >= 0 ? "+" : ""
    const offsetLabel = `UTC${offsetSign}${offsetHours}`

    const popup = document.createElement("div")
    popup.setAttribute("data-timestamp-target", "card")
    popup.className = "absolute right-0 bottom-full mb-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm whitespace-nowrap"
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

    this.element.appendChild(popup)
  }

  private removePopup(): void {
    const card = this.element.querySelector("[data-timestamp-target='card']")
    if (card) card.remove()
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
    })
  }
}

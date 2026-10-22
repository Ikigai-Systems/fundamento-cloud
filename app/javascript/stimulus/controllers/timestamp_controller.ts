import { Controller } from "@hotwired/stimulus"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

// A relative time ("3 days") that shows the exact time, on this device and in UTC, with buttons
// to copy each.
//
// A mouse opens it by hovering. A tap, a click or Enter / Space toggles it, and then it stays
// until a tap outside, Escape or another toggle: a finger can't hover, and a tap still sends a
// compatibility `mouseenter`, so hover alone would open it by accident and leave it stuck. Pointer
// events tell the two apart.
export default class TimestampController extends Controller<HTMLElement> {
  static values = {
    datetime: String,
  }

  declare datetimeValue: string
  private popup: HTMLElement | null = null
  private pinned = false
  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  connect(): void {
    this.element.classList.add("cursor-pointer")
    this.element.setAttribute("tabindex", "0")
    this.element.setAttribute("role", "button")
    this.element.setAttribute("aria-expanded", "false")
    this.element.addEventListener("pointerenter", this.handlePointerEnter)
    this.element.addEventListener("pointerleave", this.handlePointerLeave)
    this.element.addEventListener("click", this.toggle)
    this.element.addEventListener("keydown", this.handleKeydown)
    window.addEventListener("timestamp:opened", this.handleOtherOpened)
  }

  disconnect(): void {
    this.element.removeEventListener("pointerenter", this.handlePointerEnter)
    this.element.removeEventListener("pointerleave", this.handlePointerLeave)
    this.element.removeEventListener("click", this.toggle)
    this.element.removeEventListener("keydown", this.handleKeydown)
    window.removeEventListener("timestamp:opened", this.handleOtherOpened)
    this.close()
  }

  private handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse") return

    this.cancelHide()
    if (!this.popup) this.open()
  }

  private handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== "mouse" || this.pinned) return

    this.scheduleHide()
  }

  // A hover may already have opened it: the click then keeps it open rather than closing it
  private toggle = (): void => {
    if (this.popup && this.pinned) {
      this.close()
    } else {
      if (!this.popup) this.open()
      this.pinned = true
    }
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" && event.key !== " ") return

    event.preventDefault()
    this.toggle()
  }

  private handleOutsidePointerDown = (event: PointerEvent): void => {
    const target = event.target as Node
    if (this.element.contains(target) || this.popup?.contains(target)) return

    this.close()
  }

  private handleEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return

    this.close()
    this.element.focus()
  }

  // Only one popup at a time: opening another closes this one
  private handleOtherOpened = (event: Event): void => {
    if ((event as CustomEvent).detail !== this) this.close()
  }

  private scheduleHide(): void {
    this.cancelHide()
    this.hideTimeout = setTimeout(() => this.close(), 150)
  }

  private cancelHide(): void {
    if (this.hideTimeout) clearTimeout(this.hideTimeout)
    this.hideTimeout = null
  }

  private open(): void {
    window.dispatchEvent(new CustomEvent("timestamp:opened", { detail: this }))

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
    popup.setAttribute("role", "dialog")
    popup.setAttribute("aria-label", "Exact time")
    popup.className = "fixed z-50 max-w-[calc(100vw-16px)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm"
    popup.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") this.cancelHide()
    })
    popup.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && !this.pinned) this.scheduleHide()
    })

    // Each label sits above its time, which keeps the popup narrow enough for a phone screen.
    // The copy buttons reach 24px on touch without moving the layout elsewhere.
    const row = (icon: string, label: string, note: string, value: string, copyLabel: string) => `
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span class="${icon} size-4 shrink-0"></span>
          <span class="font-medium">${label}</span>
          ${note}
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="whitespace-nowrap text-gray-900 dark:text-gray-100">${value}</span>
          <button type="button" class="flex rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors touch:p-1 touch:-m-1" data-copy-value="${value}" aria-label="${copyLabel}">
            <span class="icon-[heroicons--clipboard] size-4"></span>
          </button>
        </div>
      </div>
    `

    popup.innerHTML = `
      <div class="flex flex-col gap-3">
        ${row("icon-[heroicons--computer-desktop]", "Your device", `<span class="text-xs text-gray-400">${offsetLabel}</span>`, localFormatted, "Copy your device's time")}
        ${row("icon-[heroicons--globe-alt]", "UTC", "", utcFormatted, "Copy UTC time")}
      </div>
    `

    // Bind copy handlers directly since popup is outside the controller's DOM
    popup.querySelectorAll<HTMLButtonElement>("button[data-copy-value]").forEach((button) => {
      button.addEventListener("click", (event) => this.copyValue(event))
    })

    // Append to body with fixed positioning to escape sidebar overflow clipping
    document.body.appendChild(popup)
    this.popup = popup
    this.position()

    this.element.setAttribute("aria-expanded", "true")
    document.addEventListener("pointerdown", this.handleOutsidePointerDown)
    document.addEventListener("keydown", this.handleEscape)
  }

  // Above the trigger and aligned to its right edge, below it when there is no room above, and
  // always inside the screen
  private position(): void {
    if (!this.popup) return

    const margin = 8
    const rect = this.element.getBoundingClientRect()
    const popupRect = this.popup.getBoundingClientRect()

    let top = rect.top - popupRect.height - margin
    if (top < margin) top = rect.bottom + margin

    const maxLeft = window.innerWidth - popupRect.width - margin
    const left = Math.max(margin, Math.min(rect.right - popupRect.width, maxLeft))

    this.popup.style.top = `${top}px`
    this.popup.style.left = `${left}px`
  }

  private close(): void {
    this.cancelHide()
    this.popup?.remove()
    this.popup = null
    this.pinned = false
    this.element.setAttribute("aria-expanded", "false")
    document.removeEventListener("pointerdown", this.handleOutsidePointerDown)
    document.removeEventListener("keydown", this.handleEscape)
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

import {Controller} from "@hotwired/stimulus"
import DocumentsApi from "../../api/DocumentsApi.js"
import TablesApi from "../../api/Tables/TablesApi.js"
import {publishContentUpdate} from "../../content_updated"
import {applyColorLabel} from "../../sidebar/color_label"
import createFlash from "../../utils/createFlash"
import type {ColorName} from "../../types"

type ErrorResponse = {response?: {data?: {errors?: Record<string, string>}}}

// The Color row of the Details tab (Object::SidebarColorField). A choice saves at once, with
// nothing but the color in the request so a rename and a color stay independent, then announces
// itself so the sidebar tree and the page title follow without a reload.
export default class ColorPickerController extends Controller<HTMLElement> {
  static targets = ["swatch", "name"]
  static values = {
    type: String,
    id: String,
    color: String,
  }

  declare swatchTargets: HTMLButtonElement[]
  declare hasNameTarget: boolean
  declare nameTarget: HTMLElement
  declare typeValue: string
  declare idValue: string
  declare colorValue: string

  // Saves run one after another, so the server ends on the last choice however slowly the
  // responses come back. `saved` is what the server holds, which is where a failure restores to.
  private saved = ""
  private pending = 0
  private chain: Promise<void> = Promise.resolve()

  connect(): void {
    this.saved = this.colorValue
  }

  choose(event: Event): void {
    const swatch = event.currentTarget as HTMLButtonElement
    const color = swatch.dataset.color ?? ""
    if (color === this.colorValue) return

    this.show(color)
    this.pending++
    this.chain = this.chain.then(() => this.save(color))
  }

  private async save(color: string): Promise<void> {
    try {
      await this.api().update({params: {id: this.idValue}, data: {color}})
      this.saved = color
      publishContentUpdate({id: this.idValue, color: (color || null) as ColorName | null})
    } catch (e: unknown) {
      // A newer choice is already queued and on screen: it decides what the row shows.
      if (this.pending === 1) this.show(this.saved)
      createFlash({type: "error", message: this.errorMessage(e)})
    } finally {
      this.pending--
    }
  }

  // Leaving the group puts the tab stop back on the checked swatch, after arrow keys moved it.
  resetTabStop(event: FocusEvent): void {
    if (event.relatedTarget instanceof Node && this.element.contains(event.relatedTarget) &&
        this.swatchTargets.includes(event.relatedTarget as HTMLButtonElement)) return

    this.show(this.colorValue)
  }

  // Arrow keys move between the swatches, as in any radiogroup. Moving only focuses: choosing
  // is Enter or Space, so walking along the row doesn't save every color it passes.
  navigate(event: KeyboardEvent): void {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
    if (!keys.includes(event.key)) return

    const swatches = this.swatchTargets
    const current = swatches.indexOf(document.activeElement as HTMLButtonElement)
    if (current === -1) return

    let next = current
    if (event.key === "Home") next = 0
    else if (event.key === "End") next = swatches.length - 1
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % swatches.length
    else next = (current - 1 + swatches.length) % swatches.length

    event.preventDefault()
    swatches.forEach((swatch, index) => swatch.tabIndex = index === next ? 0 : -1)
    swatches[next].focus()
  }

  private api() {
    return this.typeValue === "table" ? TablesApi : DocumentsApi
  }

  // Selection state, the tab stop and the name beside the label all come from one color.
  private show(color: string): void {
    this.colorValue = color

    this.swatchTargets.forEach((swatch) => {
      const selected = (swatch.dataset.color ?? "") === color
      swatch.setAttribute("aria-checked", String(selected))
      swatch.tabIndex = selected ? 0 : -1
    })

    if (this.hasNameTarget) {
      this.nameTarget.textContent = color ? color[0].toUpperCase() + color.slice(1) : "None"
      applyColorLabel(this.nameTarget, (color || null) as ColorName | null)
    }
  }

  private errorMessage(e: unknown): string {
    const errors = (e as ErrorResponse).response?.data?.errors
    return errors ? Object.values(errors).join("<br/>") : "Failed to update the color, please reload the page and try again."
  }
}

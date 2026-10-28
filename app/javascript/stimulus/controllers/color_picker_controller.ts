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

  // Bumped per choice: when saves overlap, only the latest one may restore the selection.
  private latestSave = 0

  async choose(event: Event): Promise<void> {
    const swatch = event.currentTarget as HTMLButtonElement
    const color = swatch.dataset.color ?? ""
    if (color === this.colorValue) return

    const previous = this.colorValue
    const save = ++this.latestSave
    this.show(color)

    try {
      await this.api().update({params: {id: this.idValue}, data: {color}})
      publishContentUpdate({id: this.idValue, color: (color || null) as ColorName | null})
    } catch (e: unknown) {
      if (save !== this.latestSave) return

      this.show(previous)
      createFlash({type: "error", message: this.errorMessage(e)})
    }
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

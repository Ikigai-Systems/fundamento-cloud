type FlashOptions = {
  key?: string,
  replacePrevious?: boolean,
  type?: "notice" | "alert" | "error",
  message: string,
  duration?: "short",
}

interface StimulusApplication {
  getControllerForElementAndIdentifier: (el: Element, id: string) => { show: (opts: FlashOptions) => void } | null
}

const createFlash = (options: FlashOptions) => {
  const flashesDiv = document.querySelector("#flashes")
  if (!flashesDiv) {
    console.error("Flash container #flashes not found")
    return
  }

  // Get the flash manager controller instance
  const app = (window as { Stimulus?: StimulusApplication; Application?: StimulusApplication }).Stimulus || (window as { Stimulus?: StimulusApplication; Application?: StimulusApplication }).Application
  const flashManager = app?.getControllerForElementAndIdentifier(flashesDiv, "flash-manager")

  if (!flashManager) {
    console.error("Flash manager controller not found on #flashes")
    return
  }

  // Call the show method on the manager
  flashManager.show(options)
}

export default createFlash;
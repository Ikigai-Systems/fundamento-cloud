// SPIKE (throwaway, see branch spike/cmdk-palette)
import ReactLoader from "./react_loader_controller"

// react-loader unmounts the React root whenever its element disconnects. A data-turbo-permanent
// element is *moved* into the new body on every Turbo visit, which Stimulus sees as
// disconnect + connect, so the plain loader remounts (and loses state) on each navigation.
// This variant keeps the root across that move: it unmounts only if the element is still
// detached once the current task is over.
export default class extends ReactLoader {
  async connect() {
    if (this._pendingUnmount) clearTimeout(this._pendingUnmount)
    this._pendingUnmount = undefined
    if (this.root) return // survived the Turbo move
    await super.connect()
  }

  disconnect() {
    this._pendingUnmount = setTimeout(() => {
      if (!this.element.isConnected) super.disconnect()
    }, 0)
  }

  declare _pendingUnmount: ReturnType<typeof setTimeout> | undefined
}

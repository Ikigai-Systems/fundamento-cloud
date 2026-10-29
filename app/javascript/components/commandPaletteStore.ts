// SPIKE (throwaway, see branch spike/cmdk-palette): holds the current page's palette commands
// outside React, so the one persistent palette instance can read what each Turbo page declares.
export type PageCommand = {
  id: string,
  title: string,
  section: string,
  icon: string,
  hotkey?: string,
  handler: string,
}

let commands: PageCommand[] = []
const listeners = new Set<() => void>()

export const pageCommandsStore = {
  set(next: PageCommand[]) {
    commands = next
    listeners.forEach(listener => listener())
  },
  get: () => commands,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}

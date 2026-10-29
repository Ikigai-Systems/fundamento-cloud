// SPIKE (throwaway, see branch spike/cmdk-palette): a cmdk-based replacement for the ninja-keys
// command palette. Not for merging.
import {useCallback, useEffect, useRef, useState, useSyncExternalStore} from "react"
import {Command} from "cmdk"
import {Turbo} from "@hotwired/turbo-rails"
import {normalizeHotkey, SequenceTracker} from "@github/hotkey"
import SearchesApi from "@/api/SearchesApi.js"
import DocumentsApi from "../api/DocumentsApi.js"
import TablesApi from "~/api/Tables/TablesApi.js"
import SpacesApi from "@/api/SpacesApi.js"
import ObjectIcon, {type ObjectType} from "./ObjectIcon"
import ColorLabel from "./ColorLabel"
import {pageCommandsStore, type PageCommand} from "./commandPaletteStore"
import type {ColorName, ObjectIcon as ObjectIconValue} from "../types"

// Mirrors TitleSearch::MIN_QUERY_LENGTH.
const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 300

type SearchResult = {
  object: {id: string, title: string, icon?: ObjectIconValue | null, color?: ColorName | null, parentPath: string, type: ObjectType},
  space: {name: string | null},
}

type StaticCommand = {id: string, title: string, section: string, icon: string, hotkey?: string, run: () => void}

// Tailwind needs literal class names, so the server's icon names map to a fixed set.
const ICON_CLASSES: Record<string, string> = {
  "home": "icon-[tabler--home]",
  "building": "icon-[tabler--building]",
  "layout-grid": "icon-[tabler--layout-grid]",
  "users": "icon-[tabler--users]",
  "user-circle": "icon-[tabler--user-circle]",
  "pencil": "icon-[tabler--pencil]",
  "device-floppy": "icon-[tabler--device-floppy]",
}

const DEFAULT_COMMANDS: StaticCommand[] = [
  {id: "home", section: "Site navigation", title: "Go to dashboard", icon: "home", hotkey: "ctrl+h,cmd+h", run: () => Turbo.visit("/")},
  {id: "organizations", section: "Site navigation", title: "View all organizations", icon: "building", run: () => Turbo.visit("/organizations")},
  {id: "spaces", section: "Site navigation", title: "View all spaces", icon: "layout-grid", run: () => Turbo.visit("/s")},
  {id: "teams", section: "Site navigation", title: "View all teams", icon: "users", run: () => Turbo.visit("/teams")},
  {id: "account", section: "Settings", title: "Go to account settings", icon: "user-circle", run: () => Turbo.visit("/users/edit")},
]

// hotkeys-js syntax ("ctrl+h,cmd+h", "CMD+Enter, CTRL+Enter", "e", "g d") -> @github/hotkey syntax.
const KEY_ALIASES: Record<string, string> = {cmd: "Meta", command: "Meta", ctrl: "Control", control: "Control", alt: "Alt", option: "Alt", shift: "Shift", enter: "Enter", esc: "Escape"}

function toGithubHotkeys(spec: string | undefined): string[] {
  if (!spec) return []
  return spec.split(",").map(s => s.trim()).filter(Boolean).map(alternative =>
    alternative.split(" ").map(chord => normalizeHotkey(chord.split("+").map(part => KEY_ALIASES[part.toLowerCase()] ?? (part.length === 1 ? part.toLowerCase() : part)).join("+"))).join(" ")
  )
}

function isFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

type Binding = {sequence: string, run: () => void, whenClosedOnly: boolean}

// Smallest viable hotkey layer: one keydown listener, @github/hotkey's normalizer and sequence
// tracker. Plain keys and sequences are ignored while typing in a field; chords with
// Control/Meta/Alt still fire there (so Mod+Enter and Mod+K work from inside the editor).
function useHotkeys(bindings: Binding[], open: boolean) {
  const bindingsRef = useRef(bindings)
  bindingsRef.current = bindings
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => {
    const tracker = new SequenceTracker()
    const onKeyDown = (event: KeyboardEvent) => {
      if (["Control", "Alt", "Meta", "Shift"].includes(event.key)) return
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey
      if (!hasModifier && isFormField(event.target)) { tracker.reset(); return }

      tracker.registerKeypress(event)
      const sequence = tracker.sequence
      const candidates = bindingsRef.current.filter(b => !(b.whenClosedOnly && openRef.current))
      const exact = candidates.find(b => b.sequence === sequence)
      if (exact) {
        event.preventDefault()
        tracker.reset()
        exact.run()
      } else if (!candidates.some(b => b.sequence.startsWith(sequence + " "))) {
        tracker.reset()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => { window.removeEventListener("keydown", onKeyDown); tracker.reset() }
  }, [])
}

function visitResult({object}: SearchResult) {
  const api = {Document: DocumentsApi, Table: TablesApi, Space: SpacesApi}[object.type]
  Turbo.visit(api.show.path({id: object.id}))
}

type TypeFilter = "All" | "Documents" | "Tables"
const TYPE_FOR_FILTER: Record<TypeFilter, ObjectType | null> = {All: null, Documents: "Document", Tables: "Table"}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All")
  const sequenceRef = useRef(0)
  // SPIKE evidence: counts mounts so Turbo behaviour can be observed.
  useEffect(() => { const w = window as unknown as {__paletteMounts?: number}; w.__paletteMounts = (w.__paletteMounts ?? 0) + 1 }, [])
  const abortRef = useRef<AbortController | null>(null)
  const pageCommands = useSyncExternalStore(pageCommandsStore.subscribe, pageCommandsStore.get)

  const close = useCallback(() => { setOpen(false); setSearch(""); setResults([]); setLoading(false); setTypeFilter("All") }, [])

  // Open event, used by the top bar's search button. Also close on any Turbo visit: the dialog
  // portals into <body>, which Turbo replaces, so an open dialog would be left on a detached body.
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("command-palette:open", onOpen)
    window.addEventListener("turbo:before-render", close)
    return () => {
      window.removeEventListener("command-palette:open", onOpen)
      window.removeEventListener("turbo:before-render", close)
    }
  }, [close])

  // Debounced server search. The sequence counter is what really stops an out-of-order
  // response; aborting only saves the wasted round trip (an aborted request that loses the race
  // still resolves/rejects after the next one started).
  useEffect(() => {
    const query = search.trim()
    const sequence = ++sequenceRef.current
    abortRef.current?.abort()

    if (query.length < MIN_QUERY_LENGTH) { setResults([]); setLoading(false); return }

    setLoading(true)
    const timer = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const found = await SearchesApi.show({query: {q: query}, fetchOptions: {signal: controller.signal}}) as SearchResult[]
        if (sequence === sequenceRef.current) { setResults(found); setLoading(false) }
      } catch {
        if (sequence === sequenceRef.current) { setResults([]); setLoading(false) }
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const run = (fn: () => void) => { close(); fn() }

  const staticCommands: StaticCommand[] = [
    ...DEFAULT_COMMANDS,
    ...pageCommands.map((c: PageCommand) => ({
      id: c.id, title: c.title, section: c.section, icon: c.icon, hotkey: c.hotkey,
      // Indirect eval, as the ninja-keys controller does: handlers are server-generated DOM strings.
      run: () => { (0, eval)(c.handler) },
    })),
  ]

  const bindings: Binding[] = [
    ...toGithubHotkeys("ctrl+k,cmd+k").map(sequence => ({sequence, run: () => setOpen(o => !o), whenClosedOnly: false})),
    ...staticCommands.flatMap(c => toGithubHotkeys(c.hotkey).map(sequence => ({sequence, run: c.run, whenClosedOnly: true}))),
  ]
  useHotkeys(bindings, open)

  const wantedType = TYPE_FOR_FILTER[typeFilter]
  const shownResults = wantedType ? results.filter(r => r.object.type === wantedType) : results
  const shownCommands = wantedType ? [] : staticCommands
  const sections = [...new Set(shownCommands.map(c => c.section))]

  return (
    <Command.Dialog
      open={open}
      onOpenChange={next => next ? setOpen(true) : close()}
      label="Command palette"
      // Server results are already filtered; commands filter here, by title. One filter
      // function instead of shouldFilter={false}, so commands keep cmdk's keyboard/selection
      // handling and only the server rows are exempt.
      filter={(value, query) => value.startsWith("srv:") ? 1 : value.toLowerCase().includes(query.toLowerCase().trim()) ? 1 : 0}
      overlayClassName="fixed inset-0 z-50 bg-gray-900/40"
      contentClassName="fixed left-1/2 top-[15vh] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-600"
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command or search..."
        className="w-full border-0 border-b border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-900 outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
      />
      <div className="flex gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-600" role="group" aria-label="Filter results">
        {(Object.keys(TYPE_FOR_FILTER) as TypeFilter[]).map(name => (
          <button key={name} type="button" aria-pressed={typeFilter === name} onClick={() => setTypeFilter(name)}
            className={`rounded-full px-3 py-0.5 text-xs ${typeFilter === name ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}>
            {name}
          </button>
        ))}
      </div>
      <Command.List className="max-h-[50vh] overflow-y-auto p-2">
        {loading && (
          <Command.Loading>
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400" data-testid="palette-loading">
              <i className="icon-[tabler--loader-2] animate-spin"/> Searching...
            </div>
          </Command.Loading>
        )}
        {!loading && <Command.Empty className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No results.</Command.Empty>}
        {shownResults.length > 0 && (
          <Command.Group heading="Documents and tables" className={groupClass}>
            {shownResults.map(result => (
              <Command.Item key={`${result.object.type}${result.object.id}`} value={`srv:${result.object.type}:${result.object.id}`}
                onSelect={() => run(() => visitResult(result))} className={itemClass}>
                <ObjectIcon type={result.object.type} icon={result.object.icon}/>
                <span className="truncate">
                  {result.space.name && <span className="text-gray-500 dark:text-gray-400">{result.space.name} ⎯ </span>}
                  {result.object.parentPath && <span className="text-gray-500 dark:text-gray-400">{result.object.parentPath}</span>}
                  <ColorLabel color={result.object.color}>{result.object.title}</ColorLabel>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {sections.map(section => (
          <Command.Group key={section} heading={section} className={groupClass}>
            {shownCommands.filter(c => c.section === section).map(c => (
              <Command.Item key={c.id} value={c.title} onSelect={() => run(c.run)} className={itemClass}>
                <i className={`${ICON_CLASSES[c.icon] ?? "icon-[tabler--point]"} shrink-0`} aria-hidden="true"/>
                <span className="grow truncate">{c.title}</span>
                {c.hotkey && <kbd className="text-xs text-gray-400">{c.hotkey.split(",")[0].trim()}</kbd>}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  )
}

const groupClass = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500 dark:[&_[cmdk-group-heading]]:text-gray-400"
const itemClass = "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-gray-900 data-[selected=true]:bg-gray-100 dark:text-gray-100 dark:data-[selected=true]:bg-gray-700"

# Editor.tsx Refactor Design

## Goal

Reduce coupling in `Editor.tsx` by introducing a Stimulus bridge controller, eliminating the `window.blockNoteEditor` global, moving utilities to dedicated files, and adding E2E tests for connection UI.

## New Files

| File | Purpose |
|------|---------|
| `app/javascript/stimulus/editor_controller.tsx` | Stimulus bridge owning editor state |
| `app/javascript/stimulus/connection_indicator_controller.ts` | Shows/hides offline indicator via DOM event |
| `app/javascript/utils/tinySimpleHash.ts` | Extracted hash utility |
| `app/javascript/utils/resolveUsers.ts` | Extracted user resolver, reuses query cache |
| `spec/e2e/cypress/e2e/documents/document-editor-connection.cy.js` | E2E tests for connection UI |

## Modified Files

| File | Change |
|------|--------|
| `app/javascript/components/editor/Editor.tsx` | Pure React component, accepts callbacks |
| `app/javascript/components/TableOfContentsPanel.tsx` | Uses Stimulus outlet API instead of `window.blockNoteEditor` |
| `app/views/documents/edit.html.erb` | Wires up Stimulus controllers |

## Architecture

### Stimulus + React bridge

`editor_controller.tsx` owns all mutable state. React `Editor` component is stateless with respect to that state — it receives props and signals back via callbacks.

```
Stimulus owns: editorInstance, connectionStale, documentBlocks
React signals back via:
  onEditorReady(editor)       → stores editorInstance
  onConnectionChange(isStale) → dispatches DOM event + createFlash
  onDocumentChange(blocks)    → updates documentBlocks, notifies outlets
```

### `editor_controller.tsx` skeleton

```typescript
export default class extends Controller {
  static outlets = ["editor-consumer"]
  static targets = ["editorRoot"]

  declare editorRootTarget: HTMLElement
  declare editorConsumerOutlets: EditorConsumerController[]

  private root: Root
  private editorInstance: BlockNoteEditor | undefined
  private documentBlocks: Block[] = []

  connect() {
    this.root = createRoot(this.editorRootTarget)
    this.renderComponent()
  }

  disconnect() { this.root.unmount() }

  getDocumentAsJson(): string {
    return JSON.stringify(this.editorInstance?.document)
  }

  private onEditorReady(editor: BlockNoteEditor) {
    this.editorInstance = editor
  }

  private onConnectionChange(isStale: boolean) {
    this.dispatch("connection-changed", { detail: { stale: isStale }, bubbles: true })
    createFlash({
      message: isStale
        ? "Disconnected from the server. Your changes are stored only locally."
        : "Connection to server restored.",
      type: isStale ? "error" : "notice",
      replacePrevious: true,
      key: "isStaleMessage",
      duration: isStale ? undefined : "short",
    })
  }

  private onDocumentChange(blocks: Block[]) {
    this.documentBlocks = blocks
    this.editorConsumerOutlets.forEach(o => o.receiveBlocks(blocks))
  }

  private renderComponent() {
    this.root.render(
      <Editor
        ...propsFromDataAttributes
        onEditorReady={(e) => this.onEditorReady(e)}
        onConnectionChange={(s) => this.onConnectionChange(s)}
        onDocumentChange={(b) => this.onDocumentChange(b)}
      />
    )
  }
}
```

### `connection_indicator_controller.ts`

Small controller — markup lives in ERB, controller only shows/hides via target:

```typescript
export default class extends Controller {
  static targets = ["offlineLabel"]
  declare offlineLabelTarget: HTMLElement

  update({ detail: { stale } }: CustomEvent) {
    this.offlineLabelTarget.style.display = stale ? "" : "none"
  }
}
```

ERB wiring:

```erb
<div id="editor-connection-indicator"
     data-controller="connection-indicator"
     data-action="editor:connection-changed@window->connection-indicator#update">
  <div data-connection-indicator-target="offlineLabel"
       style="display: none"
       class="font-semibold text-slate-400">Offline</div>
</div>
```

### ERB save button

Replace inline `window.blockNoteEditor` access with a Stimulus action:

```erb
<!-- before -->
<script>
  window.handleUpdateButton = async (e) => {
    e.currentTarget.form.elements['content_blocks'].value = JSON.stringify(window.blockNoteEditor?.document);
  }
</script>

<!-- after -->
data-action="editor#saveVersion"
```

The `saveVersion` action on `editor_controller` writes `this.editorInstance?.document` into the form field directly.

### `TableOfContentsPanel` via outlets

`TableOfContentsPanel` becomes an `editor-consumer` Stimulus controller that:
1. Receives `receiveBlocks(blocks)` calls from `editor_controller`
2. Re-renders the React component with updated blocks via `this.root.render(...)`
3. No more `window.blockNoteEditor` polling or `useInterval`

### Initial sync detection

Replace message-counting subscription patch with provider sync event:

```typescript
acProvider.on("sync", (isSynced: boolean) => {
  if (isSynced) setInitialStateReceived(true)
})
```

If `y-rb/actioncable`'s `WebsocketProvider` does not emit `sync`, fall back to parsing Y.js message bytes (same approach as `document_channel.rb`: detect `YJS_MESSAGE_SYNC` + `YJS_SYNC_STEP2`).

### `resolveUsers` utility

Extracted to `app/javascript/utils/resolveUsers.ts`. Batch-fetches uncached users via `UsersApi.index`, populates `queryClient` with `["users", id]` entries (same keys used by `MentionInlineContent`), so subsequent single-user lookups are cache-warm.

### `tinySimpleHash` utility

Extracted to `app/javascript/utils/tinySimpleHash.ts`. No behavior change.

## E2E Tests

`document-editor-connection.cy.js` — two tests:

1. Dispatch `editor:connection-changed` with `stale: true` → assert `#editor-connection-indicator` shows "Offline" and flash shows disconnection message
2. Dispatch `stale: false` → assert indicator clears and recovery flash appears

If direct event dispatch does not exercise enough real code, fall back to stubbing `acConsumer.connection.monitor.connectionIsStale` on the window.

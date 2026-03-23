# Editor.tsx Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate `window.blockNoteEditor`, move utilities to dedicated files, introduce a Stimulus bridge controller for the editor, and add E2E tests for connection UI.

**Architecture:** A new `editor_controller.tsx` Stimulus controller owns the editor instance and mutable state. The React `Editor` component becomes a pure component accepting callbacks. `TableOfContentsPanel` connects via Stimulus outlets. Connection state is broadcast via custom DOM events.

**Tech Stack:** Stimulus (Hotwire), React 18, BlockNote, Y.js, TypeScript, Cypress E2E

**Design doc:** `docs/plans/2026-03-23-editor-refactor-design.md`

---

### Task 1: Extract `tinySimpleHash` to utils

**Files:**
- Create: `app/javascript/utils/tinySimpleHash.ts`
- Modify: `app/javascript/components/editor/Editor.tsx`

**Step 1: Create the utility file**

```typescript
// app/javascript/utils/tinySimpleHash.ts
const tinySimpleHash = (s: string): number => {
  let h = 9;
  for (let i = 0; i < s.length;) {
    h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
  }
  return h ^ h >>> 9;
};

export default tinySimpleHash;
```

**Step 2: Update the import in Editor.tsx**

Remove the inline `tinySimpleHash` function and add:

```typescript
import tinySimpleHash from "../../utils/tinySimpleHash";
```

**Step 3: Verify the app still compiles**

Run: `npm run build`
Expected: no errors

**Step 4: Commit**

```bash
git add app/javascript/utils/tinySimpleHash.ts app/javascript/components/editor/Editor.tsx
git commit -m "Extract tinySimpleHash to utils"
```

---

### Task 2: Extract `resolveUsers` to utils

**Files:**
- Create: `app/javascript/utils/resolveUsers.ts`
- Modify: `app/javascript/components/editor/Editor.tsx`

**Background:** `Editor.tsx` currently has an inline `resolveUsers` function passed to `BlockNoteEditor.create`. `MentionInlineContent.tsx` uses `queryClient` with keys `["users", userId]` via `UsersApi.show`. The new utility batch-fetches uncached users and populates those same cache slots so mentions render without additional requests.

**Step 1: Create the utility**

```typescript
// app/javascript/utils/resolveUsers.ts
import queryClient from "../contextes/ReactQueryClient";
import UsersApi from "../api/UsersApi.js";
import type { User } from "../types";

const resolveUsers = async (userIds: string[]) => {
  const uncached = userIds.filter(
    (id) => !queryClient.getQueryData(["users", id])
  );

  if (uncached.length > 0) {
    const users: User[] = await UsersApi.index({ query: { user_ids: uncached } });
    users.forEach((user) => {
      queryClient.setQueryData(["users", user.id.toString()], user);
    });
  }

  return userIds.map((id) => {
    const user = queryClient.getQueryData<User>(["users", id]);
    return {
      id,
      username: user ? `${user.firstName} ${user.lastName}` : id,
    };
  });
};

export default resolveUsers;
```

**Step 2: Replace inline `resolveUsers` in Editor.tsx**

Remove the inline `resolveUsers` async function from inside `BlockNoteEditor.create` options and add:

```typescript
import resolveUsers from "../../utils/resolveUsers";
```

Then in `BlockNoteEditor.create`, change:
```typescript
// remove this entire inline function:
resolveUsers: async (userIds) => {
  const fundamentoUsers = await UsersApi.index({ ... });
  ...
},
```
to:
```typescript
resolveUsers,
```

Also remove the `UsersApi` import from `Editor.tsx` — it's no longer used directly there.

**Step 3: Verify**

Run: `npm run build`
Expected: no errors

**Step 4: Commit**

```bash
git add app/javascript/utils/resolveUsers.ts app/javascript/components/editor/Editor.tsx
git commit -m "Extract resolveUsers utility, reuse react-query cache from MentionInlineContent"
```

---

### Task 3: Fix initial sync detection

**Files:**
- Modify: `app/javascript/components/editor/Editor.tsx`

**Background:** The current code patches `subscription.received` and counts messages to detect when the initial Y.js state has arrived. The `WebsocketProvider` from `y-rb/actioncable` extends Observable and emits a `"sync"` event (same interface as `y-websocket`) when the initial sync completes.

**Step 1: Replace the subscription patching with provider sync event**

Remove the entire block:
```typescript
// hackery to determine if editor has been initialized with initial content from the action cable or not yet
const subscription = acConsumer.subscriptions.subscriptions[0];
const originalReceived = subscription.received;
subscription._messagesReceived = 0;
subscription.received = (message) => {
  subscription._messagesReceived++;
  if (subscription._messagesReceived == 2) {
    setInitialStateReceived(true);
  }
  return originalReceived(message);
}
```

Replace with:
```typescript
acProvider.on("sync", (isSynced: boolean) => {
  if (isSynced) setInitialStateReceived(true);
});
```

**Step 2: Verify sync detection works**

Run the dev server (`bin/dev`) and open a document. The editor should load content (not stay on the loading screen). Confirm in browser devtools that the `sync` event fires.

If the event does NOT fire: fall back to parsing Y.js message bytes. In that case, add a helper alongside the provider setup:

```typescript
// Y.js protocol constants (from y-protocols)
const YJS_MESSAGE_SYNC = 0;
const YJS_SYNC_STEP2 = 1;

const isSyncStep2 = (data: { update?: string }): boolean => {
  const update = data["update"];
  if (!update) return false;
  try {
    // decode the base64 update and check message/sync type bytes
    // This mirrors document_channel.rb#sync_update_message?
    const bytes = Uint8Array.from(atob(update), c => c.charCodeAt(0));
    let pos = 0;
    const readVarUint = () => {
      let num = 0, shift = 0;
      while (true) {
        const b = bytes[pos++];
        num |= (b & 0x7f) << shift;
        if (!(b & 0x80)) return num;
        shift += 7;
      }
    };
    return readVarUint() === YJS_MESSAGE_SYNC && readVarUint() === YJS_SYNC_STEP2;
  } catch {
    return false;
  }
};
```

Then patch the subscription to call `setInitialStateReceived(true)` when `isSyncStep2` returns true. Only use this fallback if `acProvider.on("sync", ...)` does not work.

**Step 3: Commit**

```bash
git add app/javascript/components/editor/Editor.tsx
git commit -m "Replace subscription message-counting hack with provider sync event"
```

---

### Task 4: Refactor `Editor.tsx` to accept callbacks

**Files:**
- Modify: `app/javascript/components/editor/Editor.tsx`

**Goal:** Remove all DOM manipulation and global state from the React component. It should only call callbacks when things happen.

**Step 1: Update `EditorProps` to include callbacks**

```typescript
type EditorProps = {
  databaseId: string,
  currentUser: User,
  document: Document,
  editable?: boolean,
  onEditorReady?: (editor: BlockNoteEditor<typeof schema>) => void,
  onConnectionChange?: (isStale: boolean) => void,
  onDocumentChange?: (blocks: Block[]) => void,
}
```

**Step 2: Remove `window.blockNoteEditor` assignment**

Delete line:
```typescript
window.blockNoteEditor = blockNoteEditor; // for .erb button_to hacks to work...
```

Also remove the `onChange` handler on the editor (it's currently a no-op with commented-out code):
```typescript
blockNoteEditor.onChange((editor) => {
  const block = editor.getTextCursorPosition().block;
  if (block.type !== 'paragraph') {
    return;
  }
  const currentBlockText = block?.content[0]?.["text"];
  // ...commented out code...
});
```

If `onDocumentChange` is provided, register it via `onChange`:
```typescript
if (onDocumentChange) {
  blockNoteEditor.onChange((editor) => {
    onDocumentChange(editor.document);
  });
}
```

And call `onEditorReady` after creating the editor:
```typescript
onEditorReady?.(blockNoteEditor);
```

**Step 3: Remove DOM manipulation — connection indicator**

Delete the entire `useEffect` that touches `#editor-connection-indicator`:
```typescript
useEffect(() => {
  const editorConnectionIndicatorDiv = window.document.querySelector("#editor-connection-indicator");
  if (connectionStale) {
    editorConnectionIndicatorDiv.innerHTML = '<div class="font-semibold text-slate-400">Offline</div>\n';
  } else {
    editorConnectionIndicatorDiv.innerHTML = '';
  }
}, [connectionStale]);
```

**Step 4: Remove flash message creation from React, call callback instead**

Replace `createFlash` calls in `useInterval` with `onConnectionChange` callback:

```typescript
useInterval(() => {
  if (window.document.hidden) return;
  const isStale = acConsumer?.connection.monitor.connectionIsStale();
  setConnestionStale((prevState) => {
    if (isStale !== prevState) {
      onConnectionChange?.(isStale);
    }
    return isStale;
  });
}, 1000);
```

Remove the `createFlash` import if no longer used.

**Step 5: Verify**

Run: `npm run build`
Expected: no errors. Note: the editor will not show connection state in UI yet — that moves to the Stimulus controller in the next task.

**Step 6: Commit**

```bash
git add app/javascript/components/editor/Editor.tsx
git commit -m "Refactor Editor.tsx to accept callbacks, remove DOM manipulation and window global"
```

---

### Task 5: Create `editor_controller.tsx` Stimulus bridge

**Files:**
- Create: `app/javascript/stimulus/editor_controller.tsx`
- Modify: `app/javascript/stimulus/index.js`

**Background:** This controller replaces `EditDocumentPanel`. It mounts React with providers, owns editor state, and handles callbacks from React. It exposes `getDocumentAsJson()` for the ERB save button and implements the `editor-consumer` outlet interface.

**Step 1: Create the controller**

```typescript
// app/javascript/stimulus/editor_controller.tsx
import { Controller } from "@hotwired/stimulus";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BlockNoteEditor } from "@blocknote/core";
import Editor from "../components/editor/Editor";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient";
import { FeaturesContext } from "../contextes/FeaturesContext";
import createFlash from "../utils/createFlash";
import type { Document, Space, User } from "../types";
import type schema from "../components/editor/schema";

// Interface that outlet consumers (e.g. TableOfContentsPanel) must implement
export interface EditorConsumerController {
  receiveBlocks(blocks: unknown[]): void;
}

export default class extends Controller {
  static outlets = ["editor-consumer"];
  static targets = ["editorRoot"];
  static values = {
    document: Object,
    space: Object,
    currentUser: Object,
    databaseId: String,
    features: Array,
  };

  declare editorRootTarget: HTMLElement;
  declare editorConsumerOutlets: EditorConsumerController[];
  declare documentValue: Document;
  declare spaceValue: Space;
  declare currentUserValue: User;
  declare databaseIdValue: string;
  declare featuresValue: string[];

  private root: Root | undefined;
  private editorInstance: BlockNoteEditor<typeof schema> | undefined;

  connect() {
    this.root = createRoot(this.editorRootTarget);
    this.renderComponent();
  }

  disconnect() {
    this.root?.unmount();
    this.root = undefined;
    this.editorInstance = undefined;
  }

  // Called by the ERB save button via data-action="editor#saveVersion"
  saveVersion(event: Event) {
    const form = (event.currentTarget as HTMLElement).closest("form");
    if (!form) return;
    (form.elements.namedItem("content_blocks") as HTMLInputElement).value =
      JSON.stringify(this.editorInstance?.document);
  }

  // Called when an editor-consumer outlet connects (e.g. ToC panel loaded lazily)
  editorConsumerOutletConnected(outlet: EditorConsumerController) {
    if (this.editorInstance) {
      outlet.receiveBlocks(this.editorInstance.document);
    }
  }

  private onEditorReady(editor: BlockNoteEditor<typeof schema>) {
    this.editorInstance = editor;
    this.editorConsumerOutlets.forEach((o) =>
      o.receiveBlocks(editor.document)
    );
  }

  private onConnectionChange(isStale: boolean) {
    this.dispatch("connection-changed", {
      detail: { stale: isStale },
      bubbles: true,
    });
    createFlash({
      message: isStale
        ? "Disconnected from the server. Your changes are stored only locally."
        : "Connection to server restored.",
      type: isStale ? "error" : "notice",
      replacePrevious: true,
      key: "isStaleMessage",
      duration: isStale ? undefined : "short",
    });
  }

  private onDocumentChange(blocks: unknown[]) {
    this.editorConsumerOutlets.forEach((o) => o.receiveBlocks(blocks));
  }

  private renderComponent() {
    this.root?.render(
      <FeaturesContext.Provider value={this.featuresValue || []}>
        <QueryClientProvider client={queryClient}>
          <CurrentSpaceContext.Provider value={{ space: this.spaceValue }}>
            <Editor
              currentUser={this.currentUserValue}
              document={this.documentValue}
              databaseId={this.databaseIdValue}
              onEditorReady={(e) => this.onEditorReady(e)}
              onConnectionChange={(s) => this.onConnectionChange(s)}
              onDocumentChange={(b) => this.onDocumentChange(b)}
            />
          </CurrentSpaceContext.Provider>
        </QueryClientProvider>
      </FeaturesContext.Provider>
    );
  }
}
```

**Step 2: Register in `stimulus/index.js`**

Add import and registration:
```javascript
import EditorController from "./editor_controller";
// ...
application.register("editor", EditorController);
```

**Step 3: Verify**

Run: `npm run build`
Expected: no errors

**Step 4: Commit**

```bash
git add app/javascript/stimulus/editor_controller.tsx app/javascript/stimulus/index.js
git commit -m "Add editor Stimulus controller as React bridge"
```

---

### Task 6: Create `connection_indicator_controller.ts`

**Files:**
- Create: `app/javascript/stimulus/connection_indicator_controller.ts`
- Modify: `app/javascript/stimulus/index.js`

**Step 1: Create the controller**

```typescript
// app/javascript/stimulus/connection_indicator_controller.ts
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["offlineLabel"];

  declare offlineLabelTarget: HTMLElement;

  update(event: CustomEvent<{ stale: boolean }>) {
    this.offlineLabelTarget.style.display = event.detail.stale ? "" : "none";
  }
}
```

**Step 2: Register in `stimulus/index.js`**

```javascript
import ConnectionIndicatorController from "./connection_indicator_controller";
// ...
application.register("connection-indicator", ConnectionIndicatorController);
```

**Step 3: Commit**

```bash
git add app/javascript/stimulus/connection_indicator_controller.ts app/javascript/stimulus/index.js
git commit -m "Add connection-indicator Stimulus controller"
```

---

### Task 7: Create `table_of_contents_panel_controller.tsx`

**Files:**
- Create: `app/javascript/stimulus/table_of_contents_panel_controller.tsx`
- Modify: `app/javascript/stimulus/index.js`

**Background:** This controller replaces the `react_component "TableOfContentsPanel"` call. It mounts the React component and implements `receiveBlocks` so it can be used as an `editor-consumer` outlet.

**Step 1: Create the controller**

```typescript
// app/javascript/stimulus/table_of_contents_panel_controller.tsx
import { Controller } from "@hotwired/stimulus";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import TableOfContentsPanel from "../components/TableOfContentsPanel";

export default class extends Controller {
  static targets = ["reactRoot"];
  static values = { content: Array };

  declare reactRootTarget: HTMLElement;
  declare contentValue: unknown[];

  private root: Root | undefined;
  private currentBlocks: unknown[] | undefined;

  connect() {
    this.root = createRoot(this.reactRootTarget);
    this.renderComponent(this.contentValue || []);
  }

  disconnect() {
    this.root?.unmount();
    this.root = undefined;
  }

  // Called by editor_controller when document blocks change
  receiveBlocks(blocks: unknown[]) {
    this.currentBlocks = blocks;
    this.renderComponent(blocks);
  }

  private renderComponent(blocks: unknown[]) {
    this.root?.render(<TableOfContentsPanel content={blocks} />);
  }
}
```

**Step 2: Register in `stimulus/index.js`**

```javascript
import TableOfContentsPanelController from "./table_of_contents_panel_controller";
// ...
application.register("table-of-contents-panel", TableOfContentsPanelController);
```

**Step 3: Commit**

```bash
git add app/javascript/stimulus/table_of_contents_panel_controller.tsx app/javascript/stimulus/index.js
git commit -m "Add table-of-contents-panel Stimulus controller as editor-consumer outlet"
```

---

### Task 8: Update `TableOfContentsPanel.tsx` — remove `window.blockNoteEditor`

**Files:**
- Modify: `app/javascript/components/TableOfContentsPanel.tsx`

**Background:** The component currently polls `window.blockNoteEditor` every second. Since it now receives blocks directly via `receiveBlocks` (re-render from controller), the polling and the `useInterval` hook can be removed.

**Step 1: Remove the window global polling**

Delete:
```typescript
import useInterval from "../hooks/useInterval.ts";
```

Delete the `useInterval` block:
```typescript
useInterval(() => {
  if (window.blockNoteEditor) {
    setDocumentBlocks(window.blockNoteEditor.document)
  }
}, 1000);
```

Delete the `useState`:
```typescript
const [documentBlocks, setDocumentBlocks] = useState(window.blockNoteEditor?.document || content);
```

The component now just uses `content` as a plain prop — no internal state needed:

```typescript
const TableOfContentsPanel = ({content}: TableOfContentsPanelProps) => {
  // use `content` directly instead of `documentBlocks`
  const headerBlocks = content.filter(...)
  ...
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: no errors

**Step 3: Commit**

```bash
git add app/javascript/components/TableOfContentsPanel.tsx
git commit -m "Remove window.blockNoteEditor polling from TableOfContentsPanel"
```

---

### Task 9: Update ERB templates

**Files:**
- Modify: `app/views/documents/edit.html.erb`
- Modify: `app/views/documents/_sidebar/table_of_contents.html.erb`

**Step 1: Update `edit.html.erb`**

Replace the connection indicator div:
```erb
<%# Before: %>
<div id="editor-connection-indicator"></div>

<%# After: %>
<div id="editor-connection-indicator"
     data-controller="connection-indicator"
     data-action="editor:connection-changed@window->connection-indicator#update">
  <div data-connection-indicator-target="offlineLabel"
       style="display: none"
       class="font-semibold text-slate-400">Offline</div>
</div>
```

Update the save button — add `data-action` for the editor controller and remove the inline onclick:
```erb
<%# Before: %>
<%= button_to document_versions_path(@document), method: :create,
  params: { content_blocks: "" },
  onclick: "handleUpdateButton(event)",
  ...
```
```erb
<%# After: %>
<%= button_to document_versions_path(@document), method: :create,
  params: { content_blocks: "" },
  data: { action: "editor#saveVersion" },
  ...
```

Remove the entire inline script block:
```erb
<%# Delete this: %>
<script type="text/javascript">
    window.handleUpdateButton = async (e) => {
        e.currentTarget.form.elements['content_blocks'].value = JSON.stringify(window.blockNoteEditor?.document);
    }
</script>
```

Replace the `react_component "EditDocumentPanel"` article with a Stimulus-controlled div. The controller reads props from `data-*-value` attributes (Stimulus Object values are JSON-serialized):

```erb
<%# Before: %>
<article class="flex flex-col flex-1">
  <%= react_component "EditDocumentPanel", {
    document: @document.to_react_props,
    space: @space.to_react_props,
    current_user: current_user,
    database_id: database_id,
    features: enabled_feature_names
  }, class: "flex flex-col flex-1" %>
</article>
```

```erb
<%# After: %>
<article class="flex flex-col flex-1"
         data-controller="editor"
         data-editor-document-value="<%= @document.to_react_props.to_json %>"
         data-editor-space-value="<%= @space.to_react_props.to_json %>"
         data-editor-current-user-value="<%= current_user.to_json %>"
         data-editor-database-id-value="<%= database_id %>"
         data-editor-features-value="<%= enabled_feature_names.to_json %>"
         data-editor-editor-consumer-outlet="[data-controller~='table-of-contents-panel']">
  <div data-editor-target="editorRoot" class="flex flex-col flex-1"></div>
</article>
```

**Step 2: Update `_sidebar/table_of_contents.html.erb`**

```erb
<%# Before: %>
<%= turbo_frame_tag :table_of_contents_sidebar_tab do %>
  <%= react_component "TableOfContentsPanel", {
    content: @document.versions.latest.present? ? @document.versions.latest.content_blocks : [],
  } %>
<% end %>
```

```erb
<%# After: %>
<%= turbo_frame_tag :table_of_contents_sidebar_tab do %>
  <div data-controller="table-of-contents-panel"
       data-table-of-contents-panel-content-value="<%= (@document.versions.latest&.content_blocks || []).to_json %>">
    <div data-table-of-contents-panel-target="reactRoot"></div>
  </div>
<% end %>
```

**Step 3: Verify in browser**

Start the dev server (`bin/dev`) and open a document for editing:
- Editor loads ✓
- Typing updates the ToC sidebar when it's open ✓
- Save button (floppy disk) still creates a version ✓
- No `window.blockNoteEditor` in console ✓

**Step 4: Commit**

```bash
git add app/views/documents/edit.html.erb app/views/documents/_sidebar/table_of_contents.html.erb
git commit -m "Wire editor and connection-indicator Stimulus controllers in ERB"
```

---

### Task 10: Delete `EditDocumentPanel.tsx`

**Files:**
- Delete: `app/javascript/components/EditDocumentPanel.tsx`

`EditDocumentPanel` is now fully replaced by `editor_controller.tsx`. It is only referenced in the ERB we just updated.

**Step 1: Delete the file**

```bash
command rm app/javascript/components/EditDocumentPanel.tsx
```

**Step 2: Verify**

Run: `npm run build`
Expected: no errors (no remaining imports)

**Step 3: Commit**

```bash
git add -A
git commit -m "Remove EditDocumentPanel, replaced by editor Stimulus controller"
```

---

### Task 11: Add E2E tests for connection UI

**Files:**
- Create: `spec/e2e/cypress/e2e/documents/document-editor-connection.cy.js`

**Background:** These tests simulate connection staleness by dispatching the custom DOM event the controller listens for, then asserting the indicator and flash message.

**Step 1: Create the test file**

```javascript
// spec/e2e/cypress/e2e/documents/document-editor-connection.cy.js
import { isOrganizationCookie } from "../../support/organization-cookies.js";

describe("Document Editor - Connection Indicator", function () {
  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
      ],
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);

    cy.appEval("Document.first.id").then((documentId) => {
      cy.visit(`/d/${documentId}/edit`);
    });

    cy.waitForEditor();
  });

  it("shows Offline label when connection becomes stale", function () {
    cy.get("#editor-connection-indicator [data-connection-indicator-target='offlineLabel']")
      .should("not.be.visible");

    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent("editor:connection-changed", {
          detail: { stale: true },
          bubbles: true,
        })
      );
    });

    cy.get("#editor-connection-indicator [data-connection-indicator-target='offlineLabel']")
      .should("be.visible")
      .and("contain", "Offline");
  });

  it("shows disconnection flash message when connection becomes stale", function () {
    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent("editor:connection-changed", {
          detail: { stale: true },
          bubbles: true,
        })
      );
    });

    cy.get("#flashes").should(
      "contain",
      "Disconnected from the server. Your changes are stored only locally."
    );
  });

  it("hides Offline label when connection is restored", function () {
    // First go stale
    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent("editor:connection-changed", {
          detail: { stale: true },
          bubbles: true,
        })
      );
    });

    cy.get("#editor-connection-indicator [data-connection-indicator-target='offlineLabel']")
      .should("be.visible");

    // Then restore
    cy.window().then((win) => {
      win.dispatchEvent(
        new CustomEvent("editor:connection-changed", {
          detail: { stale: false },
          bubbles: true,
        })
      );
    });

    cy.get("#editor-connection-indicator [data-connection-indicator-target='offlineLabel']")
      .should("not.be.visible");

    cy.get("#flashes").should("contain", "Connection to server restored.");
  });
});
```

**Step 2: Run the tests**

With E2E environment running (`bin/dev-e2e up --no-build`):

```bash
npx cypress run --project spec/e2e \
  --spec spec/e2e/cypress/e2e/documents/document-editor-connection.cy.js \
  --config baseUrl=http://localhost:4000
```

Expected: all 3 tests pass

**Step 3: Verify stability (run 3 times)**

```bash
for i in 1 2 3; do
  npx cypress run --project spec/e2e \
    --spec spec/e2e/cypress/e2e/documents/document-editor-connection.cy.js \
    --config baseUrl=http://localhost:4000 || break
done
```

**Step 4: Commit**

```bash
git add spec/e2e/cypress/e2e/documents/document-editor-connection.cy.js
git commit -m "Add E2E tests for editor connection indicator and flash messages"
```

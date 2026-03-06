# Sidebar Timestamp Popups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace always-visible UTC timestamps in sidebar with PostHog-style hover popups showing device timezone + UTC with copy buttons.

**Architecture:** A custom Stimulus `timestamp` controller extends `@stimulus-components/popover`. It reads an ISO 8601 datetime value, binds mouseenter/mouseleave in `connect()`, and dynamically generates popup HTML with timezone rows using `dayjs`. A shared ERB partial wraps the pattern for reuse across document and table sidebars.

**Tech Stack:** Stimulus, @stimulus-components/popover, dayjs (utc plugin), TailwindCSS, ERB partials

**Design doc:** `docs/plans/2026-02-24-sidebar-timestamps-design.md`

---

### Task 1: Create the Timestamp Stimulus Controller

**Files:**
- Create: `app/javascript/stimulus/controllers/timestamp_controller.ts`

**Step 1: Create the controller file**

```typescript
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
```

**Step 2: Commit**

```bash
git add app/javascript/stimulus/controllers/timestamp_controller.ts
git commit -m "feat: add timestamp Stimulus controller with hover popup"
```

---

### Task 2: Register the Controller

**Files:**
- Modify: `app/javascript/stimulus/index.js`

**Step 1: Add import and registration**

After the existing imports (around line 28), add:
```javascript
import TimestampController from "./controllers/timestamp_controller.ts";
```

After the existing registrations (around line 95), add:
```javascript
application.register("timestamp", TimestampController);
```

**Step 2: Commit**

```bash
git add app/javascript/stimulus/index.js
git commit -m "feat: register timestamp controller"
```

---

### Task 3: Create the Shared Timestamp Partial

**Files:**
- Create: `app/views/shared/_timestamp_field.html.erb`

**Step 1: Create the partial**

This partial accepts `label` and `datetime` locals. When `datetime` is nil (e.g. unpublished document), it shows a "Draft" badge instead.

```erb
<li class="flex justify-between gap-x-6 py-5">
  <div class="flex-auto min-w-0 gap-x-4">
    <p class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100"><%= label %></p>
  </div>
  <div class="flex flex-col sm:items-end">
    <% if datetime %>
      <p class="text-sm/6 text-gray-900 dark:text-gray-100"
         data-controller="timestamp"
         data-timestamp-datetime-value="<%= datetime.iso8601 %>">
        <%= time_ago_in_words datetime %>
      </p>
    <% else %>
      <p class="text-sm/6 text-gray-900 dark:text-gray-100">
        <span class="draft-lozenge">Draft</span>
      </p>
    <% end %>
  </div>
</li>
```

**Step 2: Commit**

```bash
git add app/views/shared/_timestamp_field.html.erb
git commit -m "feat: add shared timestamp field partial"
```

---

### Task 4: Update Document Sidebar

**Files:**
- Modify: `app/views/documents/_sidebar/details.html.erb`

**Step 1: Replace timestamp list items with the shared partial**

Replace the full file content with:

```erb
<%= turbo_frame_tag :details_sidebar_tab do %>
  <ul role="list" class="divide-y divide-gray-100 px-3">
    <%= render "shared/timestamp_field", label: "Created at", datetime: @document.created_at %>
    <%= render "shared/timestamp_field", label: "Updated at", datetime: @document.updated_at %>
    <%= render "shared/timestamp_field", label: "Published at", datetime: @document.versions.last&.updated_at %>

    <li class="flex justify-between gap-x-6 py-5">
      <div class="flex-auto min-w-0 gap-x-4">
        <p class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">Tags</p>
      </div>
      <div class="flex flex-col sm:items-end">
        <%= render Object::SidebarTags.new(object: @document) %>
      </div>
    </li>
  </ul>
<% end %>
```

**Step 2: Commit**

```bash
git add app/views/documents/_sidebar/details.html.erb
git commit -m "feat: use timestamp partial in document sidebar"
```

---

### Task 5: Update Table Sidebar

**Files:**
- Modify: `app/views/tables/_sidebar/details.html.erb`

**Step 1: Replace timestamp list items with the shared partial**

Replace the full file content with:

```erb
<%= turbo_frame_tag :details_sidebar_tab do %>
  <ul role="list" class="divide-y divide-gray-100 px-3">
    <%= render "shared/timestamp_field", label: "Created at", datetime: @table.created_at %>
    <%= render "shared/timestamp_field", label: "Updated at", datetime: @table.updated_at %>

    <li class="flex justify-between gap-x-6 py-5">
      <div class="flex-auto min-w-0 gap-x-4">
        <p class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">Tags</p>
      </div>
      <div class="flex flex-col sm:items-end">
        <%= render Object::SidebarTags.new(object: @table) %>
      </div>
    </li>
  </ul>
<% end %>
```

**Step 2: Commit**

```bash
git add app/views/tables/_sidebar/details.html.erb
git commit -m "feat: use timestamp partial in table sidebar"
```

---

### Task 6: Manual Verification

**Step 1: Start the dev server**

```bash
bin/dev
```

**Step 2: Open a browser session and verify**

```bash
bin/browser-session-for sarah@brightpath.example.com
```

Navigate to a document or table, open the sidebar details tab, and verify:
- Timestamps show only relative time (no UTC line below)
- Hovering over a relative time shows the popup with device timezone + UTC rows
- Copy buttons work and show a check icon briefly
- Popup stays visible when moving mouse onto it
- Popup dismisses on mouse leave
- Dark mode renders correctly

**Step 3: Final commit (if any style tweaks needed)**

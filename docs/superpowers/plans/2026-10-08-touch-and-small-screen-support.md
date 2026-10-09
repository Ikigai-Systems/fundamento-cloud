# Touch and small-screen support

Status: proposal · 2026-10-08

## Why

Fundamento has never been designed or tested for phones or tablets. Three bugs were seen on
an iPhone. Investigating them found the cause of each, and showed they are symptoms of gaps
across the whole app, not one-off defects.

## The three reported bugs: root causes

### 1. "Switch to" on the Organizations page does nothing

This is not a touch bug. Sentry traces show **13 POSTs to `OrganizationsController#select`
from Mobile Safari at 2026-09-30 17:11 UTC, every one answered 422**, plus 4 more at 09:16 the
same day.

A 422 on a plain form POST is Rails rejecting the CSRF token. Turbo renders nothing for a 422
that carries no Turbo Stream, so the button looks dead.

- **Why it hit the phone:** iOS Safari restores tabs from its page cache, so the HTML still
  carried a token from an earlier session after the session rotated (for example a re-login
  through the remember-me cookie).
- **Why nothing caught it:** `config/environments/test.rb:35` disables forgery protection, so
  no spec can see this class of failure.
- **Not reproducible locally:** WebKit with touch emulation and a fresh page switches fine.

### 2. Sidebars cover the content; their toggles are invisible

- **Default state:** both sidebars default to open on every screen size
  (`_left_sidebar.html.erb:8` and `_right_sidebar.html.erb:7` read a cookie, and no cookie
  means open).
- **Layout below `lg` (1024px):** both panels are `fixed`, 300px wide, with no backdrop
  (`sidebar.tailwind.css:19-22`). At 390px they overlap each other and the document.
  Reproduced in WebKit on iPhone 14.
- **Hidden toggles:** while open, the collapse toggle is `opacity-0` and is revealed only by
  `:hover` (`sidebar.tailwind.css:100,111`). It is invisible but still tappable, sitting
  over the content edge, so it causes accidental collapses.

### 3. "Expand ]" tooltip shows on tap

- **Cause:** the triggers bind `mouseenter->popover#show mouseleave->popover#hide`.
- **Why it sticks:** iOS sends a simulated `mouseenter` on tap, and `mouseleave` only comes
  on the next tap elsewhere.
- **Why the label is wrong:** the card's text follows the *new* state, so it says "Expand"
  right after collapsing.
- **Dead code:** the `touch->…#toggle` action in the same attribute is not a real DOM event
  and never fires.

### Bonus: flash banner clipped (screenshot 1)

`flash_manager_controller.ts` ends each flash at `-left-8` inside a full-width container,
with a `max-w-sm` (384px) box.

- **Clipping:** below 416px of viewport the box starts off-screen. At 390px it spans
  x = −26…358.
- **Missing animation:** `transition-position` doesn't exist in the build, so the slide
  never animates.
- **Never dismissed:** server flashes have no auto-dismiss, so on a phone the banner sits
  over the content until the user hits the small ×.

## What else the audit found

The full audit was read-only. Below are the issues most likely to bite, worst first.

| Area | Problem | Where |
|---|---|---|
| Navigation | Search / command palette opens only with Cmd/Ctrl+K: **no way to search on touch** | `command_palette_controller.js`, ninja-keys |
| Navigation | Space switcher and dashboard link live only inside the left sidebar | `spaces/_sidebar/_spaces_menu.html.erb` |
| Hover-only | Sidebar tree "+ child" / "edit" buttons are `opacity-0` until hover, but still tappable, so phantom taps create or edit | `space-sidebar.tailwind.css:58-60` |
| Hover-only | Starred "remove", formula/button "configure", table footer summary | `_starred_item.html.erb`, `FormulaInlineContent.tsx:110`, `ButtonInlineContent.tsx:92`, rowstack |
| Hover-only | Timestamp popup (holds copy buttons), reactions "who reacted", avatar overflow, icon-only tab names | 4 tooltip mechanisms, none responds to focus or tap |
| Tables | Cell editing needs double-click or Enter. Column resize is mouse-only. Header swipes are blocked | `vendor/javascript/rowstack/main.js` (0 touch handlers) |
| Editor | BlockNote side menu (drag, delete, turn into, colours) appears on `mousemove` | BlockNote default |
| Drag & drop | Sidebar reorder uses HTML5 DnD (`html5sortable`); on iOS a long-press on an `<a>` opens link preview instead | `draggable_controller.ts` |
| Overflow | `min-w-[40rem]` table/chart cards; `min-w-96` popups; 108px of editor side padding; landing tabs clipped at 390px | `AdvancedTable.tsx`, `ChartBlock.tsx`, `FormulaConfiguration.tsx`, … |
| Copy | "Use Ctrl+K or Cmd+K to open quick search" is shown on phones | dashboard |
| Platform | No `(hover: hover)` / `pointer: coarse` anywhere; Tailwind `hover:` sticks after a tap on iOS | `config/tailwind.config.js` |
| Tests | Cypress pinned to 1280×720 in Electron; no system specs, no WebKit, no visual tests; CSRF off in test | `spec/e2e/cypress.config.cjs` |

Already fine:
- the viewport meta tag
- comment actions (always visible)
- dropdowns (close on `touchstart`)
- native scrolling in the table body

## Design principles to adopt

1. **Design for input capability, not screen width.** Width says where things fit;
   `(hover: hover)` and `(pointer: coarse)` say how the user interacts. An iPad with a
   keyboard is wide and touch. A small desktop window is narrow and mouse. Use both axes.
2. **No information or action may live only behind hover or a keyboard shortcut.** Hover
   and shortcuts are accelerators on top of a visible control.
   - Row actions get an always-visible `⋯` menu on touch.
   - Tooltips also open on focus and long-press, or the label is visible.
   - Search gets a button.
3. **Off-canvas drawers below `lg`.**
   - **Drawer behaviour:** sidebars become drawers that start closed, have a backdrop, close
     on tap outside, on Escape and after navigation, and make the page `inert` while open.
   - **Saved state:** the saved open/closed state applies only at `lg` and up.
   - **Reachability:** the top bar always shows a menu button and a search button.
4. **Targets of at least 44×44px on coarse pointers.** WCAG 2.5.8 sets 24px as the floor;
   44px is Apple's guideline. Hit areas can be larger than the icon.
5. **Use Pointer Events, not mouse events.** In code that reacts to hover, check
   `event.pointerType === "mouse"`. Never rely on `dblclick` or `mouseenter` for a primary
   action.
6. **Fluid layout.**
   - **Overflow:** no fixed `min-w` wider than 320px outside a scroll container.
   - **Container queries:** use `@tailwindcss/container-queries` for components that live
     in both wide and narrow slots (cards, embedded tables).
   - **Viewport and safe areas:** use `dvh`, not `vh`, for full-height layouts.
     Add `viewport-fit=cover` plus `env(safe-area-inset-*)` for the iOS toolbar and notch.
7. **Fail loudly.**
   - A rejected form must show a message, never silence.
   - Handle `InvalidAuthenticityToken` for HTML and Turbo requests: redirect back with
     "Your session changed — please try again" and send a fresh token.
   - Send `Cache-Control: no-store` on authenticated HTML so iOS cannot resurrect stale
     forms.
8. **Decide the scope per surface.** Reading, navigating, commenting and light editing
   should work everywhere. Heavy editing (table column resize, block drag) may stay
   desktop-first, but it must degrade to a visible alternative, never to a dead control.

### Tooling that enforces the principles

- **Tailwind hover:** set `future: { hoverOnlyWhenSupported: true }` so `hover:` stops
  sticking on iOS.
- **Custom variants:** add `can-hover:` and `touch:` variants
  (`@media (hover: hover) and (pointer: fine)` /
  `@media (hover: none), (pointer: coarse)`). Hover reveals then read
  `opacity-0 can-hover:group-hover:opacity-100 touch:opacity-100`.
  - **Caveat:** once `hoverOnlyWhenSupported` is on, every `opacity-0 group-hover:opacity-100`
    element is *permanently* invisible on touch unless it also gets `touch:`. So the flag
    and the sweep of those five sites must land together.
- **Tooltip:** one tooltip Stimulus controller replaces the `mouseenter` / `mouseleave`
  wiring. It reacts to pointer (mouse only), focus, and long-press, and uses floating-ui for
  collision handling.
- **One media helper** (`app/javascript/lib/input.ts`): `canHover()`, `isCoarse()`,
  subscribable. React gets `useMediaQuery`. No ad-hoc user-agent sniffing.
- **Lint rule:** a small ESLint / CI grep check that fails on:
  - `mouseenter->` without a matching `focus` trigger
  - `group-hover:opacity-100` without `touch:`
  - `onDoubleClick` as the only edit path
  - `min-w-` above 320px outside an allow-list

## Test environment

The existing Cypress suite gains device profiles, so no second framework is needed.

### Viewport size alone is not a touch test

`agent-browser`'s `set device` and Cypress's `cy.viewport` give a narrow page that still
reports `hover: hover`, `pointer: fine` and no touch, so hover-only controls look fine.
Chrome's touch emulation (`Emulation.setTouchEmulationEnabled`, what DevTools' device mode
uses) flips all three. Cypress reaches it through
`Cypress.automation("remote:debugger:protocol")`, which works in Electron, the browser CI
uses.

### What is in place (Phase 0, done)

**Device profiles.**
- `spec/e2e/cypress/support/devices.cjs` defines three profiles:
  - `desktop` 1280×720
  - `phone` 390×844, touch
  - `tablet` 820×1180, touch
- Run one with `--expose device=phone`, or `bin/dev-e2e test --device phone`.
- `cypress.config.cjs` sets the viewport and user agent per profile, writes per-device
  screenshots, and keeps a separate JUnit file per device.
- `support/device.js` turns on touch emulation before each test.
- The user agent is Android Chrome, not iPhone. The engine is Chromium either way, and an
  iPhone user agent makes ProseMirror take Safari code paths inside Chrome.

**`cy.checkPageHealth()`** (`support/page-health.js`), called once a page has settled,
fails on:
- **overflow:** the page scrolls sideways, or a visible element is cut by a viewport edge
- **invisible tappable controls (touch only):**
  - controls at opacity 0
  - hit areas that draw nothing at all, like the sidebar toggle strip
  - Stimulus `click->` elements count as controls
- **tap targets under 24px (touch only):** inline links in a sentence are exempt, per WCAG
- **4xx/5xx responses in the current document:** read from the Resource Timing API's
  `responseStatus`, so no `cy.intercept` is needed. This catches a silently rejected form.
- **console errors** since page load

Options: `ignore: [selectors]` for known issues with a follow-up,
`allowStatuses: [404]` for expected errors.

**Real touch: `cypress-real-events`.**
- `.realTouch()` dispatches a real touch through CDP. `cy.click()` stays a synthetic mouse
  event, hover included, so a spec using `.click()` has not proved a finger can do it.
- `.realTouch()` misses when something covers the target, which is useful in itself: it
  showed that the open right sidebar covers the left sidebar's toggle.

**Phone smoke spec.**
- `spec/e2e/cypress/e2e/devices/touch-smoke.cy.js` skips itself unless the run is a touch
  profile.
- It encodes the target behaviour for the reported bugs:

  | Test | Today | Fixed by |
  |---|---|---|
  | `/` and `/users/edit` health | passes | |
  | `/d/one` health | fails: 4 hover-only tree buttons + 2 invisible toggle strips | Phase 1.3, 3.1 |
  | `/organizations` health | fails: "Switch to" is 63×20px | Phase 3 |
  | document not covered by sidebars | fails: `#content-sidebar` at screen centre | Phase 1.3 |
  | no tooltip after tapping a toggle | fails: card stays after a verified tap | Phase 1.4 |
  | switch org by tap, flash fits | fails: flash left edge at x = −26 | Phase 1.2 |
  | expired form token shows a message | fails: nothing is shown | Phase 1.1 |

**CI.**
- `run-e2e-tests.yaml` is a matrix over devices: a `desktop` leg runs the whole suite and
  a `phone` leg runs the `devices/` specs, each on its own runner and environment, in
  parallel. Wall-clock time doesn't grow. Only the desktop leg writes the build cache.
- Adding a leg (a `tablet`, or the whole suite as a phone nightly) is one more matrix
  entry.
- They publish as a separate check, "Cypress Phone Test Results".
- That check is **red on purpose** while the failures above are open: the reporting action
  sets a check's result from the test results alone. `fail_on_failure: false` keeps the
  job itself green. Flip it to `true` once the smoke spec passes, so the fixes are guarded
  against regressions.

**The whole existing suite as a phone** (`bin/dev-e2e test --device phone`) is a discovery
tool, not a gate. Desktop specs use `.trigger("mouseenter")` and keyboard shortcuts that
have no phone equivalent.

**First run, 2026-10-08:**
- **Result:** 95 of 278 tests fail (23 of 38 specs), against 0 on desktop.
- **Main cause:** in about 85 of them, Cypress refused to click or type because a sidebar
  covered the target. The covering element was one of:
  - the right sidebar's scroll body (41)
  - its invisible toggle strip (11)
  - its tab buttons (14)
  - left-sidebar tree rows (≈10)
- **Other causes:** the remainder are hover/double-click flows (`trigger("mouseenter")`,
  `dblclick`) and the smoke spec's known failures.
- **What follows:** Phase 1.3 (sidebars as drawers) is the single change that unblocks most
  of the suite on phones. Rerun after it lands to see the next layer.

### Still to add

- **`cypress-axe`:** accessibility checks with the `target-size` rule and the WCAG 2.2 AA
  rules, called from `checkPageHealth`.
- **Screenshot comparison:**
  - `cypress-image-diff` (local baselines), or a hosted service (Argos/Percy)
  - ~10 key screens × phone/desktop
- **RSpec:** a request spec group with forgery protection switched on
  (`around { |ex| ActionController::Base.allow_forgery_protection = true; ex.run; ensure … }`).
  `test.rb` disables it, so no spec can see a stale-token failure today. The E2E `e2e`
  environment keeps it on, which is why the smoke spec can.

### What Cypress cannot cover

Cypress cannot test Safari's engine: its WebKit support is experimental and has no touch
emulation. The stale-token bug came from real Safari behaviour (restoring a tab from its
page cache), which no emulator reproduces. The following cover that gap.

**Real devices** cover what emulators miss: Safari's page cache, the toolbar, keyboards,
long-press menus.
- **Laptop Safari:**
  - Install the iOS Simulator (Xcode → Settings → Components). It runs real Mobile Safari,
    and `agent-browser -p ios` can drive it through Appium.
  - Attach Safari Web Inspector to your phone over USB to debug live.
- **Device cloud:** optional, BrowserStack or LambdaTest for a monthly manual pass on older
  iOS and Android Chrome.
- **WebKit suite:** if Safari-only layout bugs keep turning up, add a small Playwright WebKit
  smoke suite then: a reaction to evidence, not a second suite from day one.

**Production signal:** Sentry already records browser per transaction. Add:
- a saved query for `http.status_code:[4xx] browser.name:"Mobile Safari"`
- a metric alert on 422s from any browser

That is how bug #1 was found, and it would find its siblings.

## Plan

Each fix turns a failing phone smoke test green, or adds one, so the regression net grows
with every PR.

### Phase 0: Harness (done on `test/touch-device-e2e`)

See "What is in place" above.

### Phase 1: Fix the reported bugs (≈2–3 days, one PR each)

1. **Stale CSRF:**
   - rescue `InvalidAuthenticityToken` for HTML/Turbo requests, redirect back with a flash
   - add `no-store` on authenticated HTML
   - request spec with forgery protection on; the smoke spec's expired-token test goes green
2. **Flash:**
   - position with `inset-x-4 sm:right-4 sm:left-auto`; delete the dead `left-96` / `-left-8`
     slide (or define the transition)
   - offset below the nav, auto-dismiss notices
   - test: the flash box is within the viewport on iPhone
3. **Sidebars as drawers below `lg`:**
   - closed by default, backdrop, close on outside tap, Escape and navigation, `inert`
     content
   - the cookie applies only at `lg` and up
   - toggles are always visible on touch, and the invisible hit strip is removed
   - test: on iPhone, page load shows content unobstructed; the menu opens a drawer, and
     tapping the backdrop closes it
4. **Tooltip:**
   - the new tooltip controller (mouse-pointer hover and focus only)
   - remove the fake `touch->` action
   - test: tapping a toggle leaves no tooltip in the DOM

### Phase 2: Discovery sweep (≈2 days, produces the backlog)

1. **Crawler spec** (Cypress, `devices/crawl.cy.js`):
   - visits every GET route a seeded user can reach, generated from `bin/rails routes` and
     the Oaken seed data
   - covers documents, tables, spaces, settings, organizations, teams, tokens, the auth
     pages, and the public document view
   - runs `checkPageHealth` on each page as phone and tablet
   - output: a report of overflow, small targets, invisible-clickables and axe violations
     per page and device, with screenshots
2. **Scripted journeys in `devices/`, using `.realTouch()`**, the things people actually do on a phone:
   - sign in
   - switch organization
   - switch space
   - search
   - open a document
   - comment
   - react
   - mention
   - edit a paragraph
   - open a table, edit a cell, add a row
   - open the notifications
   - sign out
3. **One hour of manual exploratory testing on a real iPhone and an iPad**, following the
   same journeys. Also cover:
   - the on-screen keyboard over the editor
   - rotation
   - background/restore (the bug #1 path)
   - long-press menus
   - pinch zoom
4. Triage everything into one tracked list. Each item gets a severity (blocked / degraded /
   cosmetic) and the surface it belongs to.

### Phase 3: Systemic fixes (≈1–2 weeks)

1. Tailwind `hoverOnlyWhenSupported` plus the `can-hover:` / `touch:` variants, and sweep
   the hover-reveal sites in the same PR.
2. Mobile top bar:
   - menu (left drawer), search button (opens the command palette), title, overflow menu
     (right drawer, notifications, user)
   - hide the Ctrl+K hint on touch
3. Row actions: an always-visible `⋯` on touch for the sidebar tree, starred items and table
   rows.
4. Tooltip controller everywhere (8 popover sites, timestamps); `title=` on icon-only buttons
   becomes `aria-label` plus a visible label where the space allows.
5. Overflow fixes: embedded table/chart cards, formula/button popups, editor padding on
   narrow screens (container queries), landing tabs scroll horizontally.
6. Lint rule and a `.claude/rules/touch-devices.md` so future changes (human or Claude)
   follow the patterns.

### Phase 4: Heavy-interaction surfaces (scope decision first)

Decide what a phone user can do in tables and the editor, then implement to that line:
- **Tables (rowstack):** single tap selects, a second tap or an "edit" button edits
  (no double-tap); header swipe; a column menu instead of drag-resize on touch.
- **Editor:** expose BlockNote's block actions through a tap target or the formatting
  toolbar on touch.
- **Sidebar reorder:** "Move to…" menu action on touch instead of drag.

### Ongoing

- Every PR runs the phone smoke specs in CI. The PR template gets a "checked on touch /
  narrow" box.
- The whole suite as phone and tablet, plus the crawler, nightly; visual snapshot diffs
  reviewed on change.
- Sentry 4xx-by-browser alert.
- A monthly 30-minute real-device pass.

## Open decisions

- **Phone scope for tables and the editor** (Phase 4): read and light edit, or full parity?
- ~~Playwright alongside Cypress?~~ Decided: Cypress with device profiles; WebKit only if
  Safari-specific bugs justify it.

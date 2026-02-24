# Sidebar Timestamp Popups Design

## Goal

Replace the always-visible UTC timestamps in document/table sidebars with PostHog-style hover popups showing timezone conversions.

## Current State

The sidebar detail panels (`documents/_sidebar/details.html.erb`, `tables/_sidebar/details.html.erb`) show:
- Relative time ("about 2 months") as primary text
- Raw UTC timestamp below in gray text (always visible)

## New Behavior

- Show only the relative time as visible text
- On hover, display a floating popup with two rows:
  1. **Your device** timezone label + full date/time in local timezone + copy button
  2. **UTC** + full date/time in UTC + copy button
- Popup dismissed on mouse leave

## Implementation

### New Stimulus Controller: `timestamp_controller.ts`

Extends `@stimulus-components/popover` (via FixedPopover pattern). Accepts a single `datetime` value (ISO 8601 string). Binds mouseenter/mouseleave in `connect()` — no `data-action` needed in markup.

**ERB usage:**
```erb
<span data-controller="timestamp"
      data-timestamp-datetime-value="<%= @document.created_at.iso8601 %>">
  <%= time_ago_in_words @document.created_at %>
</span>
```

**Popup generation:** Controller dynamically builds popup HTML from the datetime value using `dayjs` for timezone formatting. Each row has a copy button using `navigator.clipboard.writeText()`.

### Shared ERB Partial: `shared/_timestamp_field.html.erb`

Reusable partial taking `label` and `datetime` locals, rendering the sidebar list item with the timestamp controller attached.

### Files

| File | Action |
|------|--------|
| `app/javascript/stimulus/controllers/timestamp_controller.ts` | New |
| `app/javascript/stimulus/index.js` | Register controller |
| `app/views/shared/_timestamp_field.html.erb` | New partial |
| `app/views/documents/_sidebar/details.html.erb` | Use partial |
| `app/views/tables/_sidebar/details.html.erb` | Use partial |

### Dependencies

- `dayjs` (already installed) with `utc` and `timezone` plugins
- Extends existing `@stimulus-components/popover`
- Styling uses existing Tailwind classes and `.popover-tooltip-card` pattern

# Document Contributors Display

## Overview

Display document contributors (users from DocumentEditingSessions) in two places:
1. Document show page — "Contributors" field in the sidebar details panel
2. Document history — contributor avatars per version in the sidebar and index table

## Model Layer

**Document#contributors** — unique users from all editing sessions for the document, sorted by display_name:

```ruby
def contributors
  User.joins(organization_memberships: :editing_sessions)
      .where(document_editing_sessions: { document_id: id })
      .distinct
      .order(:first_name, :last_name)
end
```

**Version#contributors** — unique users from editing sessions linked to that version:

```ruby
def contributors
  User.joins(organization_memberships: :editing_sessions)
      .where(document_editing_sessions: { version_id: id })
      .distinct
      .order(:first_name, :last_name)
end
```

No `edited: true` filter — all users who participated in an editing session are included.

## UserAvatarsGroup ViewComponent

New component at `app/components/user_avatars_group.rb` + `user_avatars_group.html.erb`.

**Parameters:**
- `users:` — collection of User objects (already sorted)
- `organization:` — for online status indicator in avatars
- `max: 4` — max visible avatars before showing +N overflow
- `variant: "sm"` — avatar size variant passed to UserAvatar

**Rendering:**
- Stacked horizontal layout using `isolate flex -space-x-1 overflow-hidden`
- Each avatar gets descending z-index (z-30, z-20, z-10, z-0)
- Avatars rendered via existing `UserAvatar` component with `ring-2 ring-white` outline
- If users.count > max: show first (max-1) avatars + a `+N` circle for the rest
- The `+N` circle uses the existing `popover` Stimulus controller (mouseenter/mouseleave)
- Popover content: vertical list of remaining users with avatar + display_name

## Document Show Page — Sidebar Details

Add "Contributors" field in `app/views/documents/_sidebar/details.html.erb` after "Published at", before "Tags". Same `<li>` structure as existing fields. Renders `UserAvatarsGroup`. Hidden when no contributors exist.

## Document History — Version Show Sidebar

In `app/views/documents/versions/show.html.erb`, add `UserAvatarsGroup` to each version entry in the sidebar. Positioned after the version info text, using `xs` variant avatars.

## Document History — Index Table

In `app/views/documents/versions/index.html.erb`, add a "Contributors" column after "Created by". Renders `UserAvatarsGroup` per version row.

## E2E Tests

Update `document-editing-sessions.cy.js`:
- Assert contributor avatars are visible in version history UI after creating editing sessions
- Supplement existing `cy.appEval()` database assertions with UI assertions

Update `document-editor.cy.js`:
- In version history tests, verify contributor avatars appear for created versions

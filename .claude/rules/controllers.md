---
paths:
  - "app/controllers/**/*.rb"
  - "app/controllers/concerns/**/*.rb"
  - "app/channels/**/*.rb"
  - "app/tools/**/*.rb"
  - "app/policies/**/*.rb"
---

# Controllers

## Load records through the current organization

There is no tenant default scope: `Document.find(id)` finds a document in **any**
organization. Load what a request names through the organization it is acting for:

```ruby
@space = current_organization.spaces.find(params[:space_id])   # not Space.find
```

Then authorize it as usual. Records without an `organization_id` of their own (inline comment
threads, cells) go through their parent: `@document.inline_comment_threads.find(...)`.

`SpacePolicy` is the backstop. Its checks deny a space outside the current organization, and
the document, table, automation, comment and attachment policies all defer to it. A lookup
that skips the organization therefore ends in a 403 rather than another tenant's data, but
callers still scope the lookup: a 404 doesn't confirm the id exists, and not every policy
reaches a space. A new policy for a record that doesn't belong to a space needs its own
`record.organization_id == current_organization.id` check (see `ImportSessionPolicy`), and
its `Scope#resolve` must filter by organization too.

## after_action ordering

Rails executes `after_action` callbacks in **reverse declaration order** (declared first → runs last). When one after_action depends on state set by another (e.g., an ivar from a concern), declare the dependent one **before** the concern include.

```ruby
# Runs second (after TrackObjectVisit sets @document_first_visit)
after_action :my_callback, only: [:show]

# Runs first (sets @document_first_visit)
include TrackObjectVisit.for_instance_variable(:@document)
```

## TrackObjectVisit concern

- Include via `TrackObjectVisit.for_instance_variable(:@varname)`
- Sets `@varname_first_visit` (boolean) after the visit is recorded
- The ivar is only available in after_actions that run after the concern's callback

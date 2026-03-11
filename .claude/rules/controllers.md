---
globs: ["app/controllers/**/*.rb", "app/controllers/concerns/**/*.rb"]
---

# Controllers

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

# Yjs document content is not a history

`object_contents.sync` holds the **current** Yjs state only. It cannot be rewound to an earlier
state, so it is no substitute for versions.

Insert text, delete it, and the deleted content is absent from `diff`, `full_diff`, `diff_v2`,
`state` and `state_v2`: garbage collection strips it, and the tombstone records *that* a range
died, not what it said. This can't be switched off here:

- `Editor.tsx` creates `new Y.Doc()`, with GC on (the default).
- `Y::Doc.new` in y-rb 0.7.0 takes **no options**, so GC can't be disabled server-side, and y-rb
  exposes no `snapshot` equivalent. The Rust crate underneath (yrs) supports it; the gem doesn't
  expose it.
- `Y::Actioncable::Sync#persist` stores `doc.diff` from the *server's* doc, so a client with
  `gc: false` would still have its history stripped on re-encode.
- Yjs has no partial-history purge: flattening a doc changes client ids and breaks concurrent
  sessions.

Versions come only from the explicit Save (`app/views/documents/edit.html.erb`), imports and
onboarding content; nothing saves one periodically. Before planning content-snapshot work, measure
how many documents are actually unprotected (content newer than their last version) rather than
assuming. The last time it was assumed, the estimate was an order of magnitude too high.

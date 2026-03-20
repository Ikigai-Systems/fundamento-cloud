# BlocknoteBlocks Service

- `app/services/blocknote_blocks.rb` is the **single source of truth** for traversing BlockNote block trees.
- All code that walks blocks or extracts mentions/references must use this service — do not add private walkers to individual classes.
- `walk_blocks` traverses `content` (inline), `children` (nested blocks), and `tableContent > rows > cells > content` (table cells).
- Consumers: `ObjectReferenceReconciler`, `MentionsExtractor`, seed `resolve_user_mentions!`.

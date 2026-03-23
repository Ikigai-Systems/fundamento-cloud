# Improve Object Comments

## Context

Object comments (on documents and tables) lack basic interaction features: no way to cancel the new comment form, no edit capability, and no delete capability. This spec adds cancel, edit, soft-delete, and restore functionality.

## Scope

This applies only to **object comments** (`ObjectComment` model) — the general comments at the bottom of documents and tables. Inline comments (embedded in document content) are out of scope.

## Prerequisite: Fix policy bug

`ObjectCommentPolicy#update?` and `#destroy?` use `=` (assignment) instead of `==` (comparison). This silently reassigns the membership and always returns truthy. Fix to `==` before implementing any author-only features.

## Features

### 1. Cancel new comment form

**Current behavior:** Clicking the "Comment" button opens the new comment form via Turbo Frame. The "Comment" button remains visible. There is no way to dismiss the form.

**New behavior:**
- Clicking "Comment" opens the form AND hides the "Comment" button
- A "Cancel" button appears next to the "Add" button in the form
- Clicking "Cancel" dismisses the form and restores the "Comment" button

**Implementation notes:**
- `_frames.html.erb` has two frames: `"new_object_comment"` (form target) and `"add_object_comment"` (button). When the form loads into `"new_object_comment"`, the `"add_object_comment"` frame must be hidden. When the form is cancelled or submitted, the button frame reappears.
- The `new.html.erb` template wraps content in `turbo_frame_tag "new_object_comment"`. The `_frames.html.erb` link targets this same frame via `data: { turbo_frame: dom_id(ObjectComment.new) }` (which resolves to `"new_object_comment"`).
- Cancel renders an empty `turbo_frame_tag "new_object_comment"` response, which clears the form and lets the button frame show again. This can be a simple `cancel` action or a link that targets the frame with an empty response.

### 2. Edit comment (author only)

**Behavior:**
- An "Edit" button is visible on each comment card, but only to the comment's author
- Clicking "Edit" switches the comment's BlockNote editor from read-only to editable mode in place (inline replace)
- "Save" and "Cancel" buttons appear below the editor
- "Save" sends the updated content, then switches back to read-only
- "Cancel" discards changes and switches back to read-only

**Technical approach — BlockNote editability toggle:**
- `BlockNoteView` accepts a reactive `editable` prop — internally it has a `useEffect` that calls `editor.isEditable = editable` when the prop changes
- The editor instance is created once via `useMemo` (must keep `useMemo`) and stays mounted — no remounting, no content loss
- `EditCommentPanel` gains internal state (`editing: boolean`) that controls the `editable` prop passed to `CommentEditor`
- When entering edit mode, snapshot the current editor content (via `editor.document`) so Cancel can restore it
- No server-side `edit` action needed — edit mode is handled entirely client-side by toggling React state

**Save mechanism:**
- Save uses `fetch` from React (not a Rails form) to `PATCH /comments/:id` with JSON body `{ comment: { content: JSON.stringify(editor.document) } }`
- Include CSRF token from `<meta name="csrf-token">` in the request header
- On success, flip `editing` back to `false`; the `after_commit` broadcast reloads the frame anyway
- Response format: `head :ok` (no body needed — Turbo Stream broadcast handles the UI update)

**Props change for `_comment.html.erb`:**
- Currently renders `EditCommentPanel` with `object`, `space`, `comment`, `editable: false`
- Must also pass `current_user` and `comment_id` when the user is the comment author, so the editor has what it needs for editable mode (file uploads, mentions, save endpoint)

**Controller:**
- New `update` action on `CommentsController`
- Finds the comment: `@comment = @resource.comments.find(params[:id])`
- Authorizes: `authorize @comment` (invokes `ObjectCommentPolicy#update?` — author only)
- Updates content: `@comment.update!(update_params)`
- Returns `head :ok`

**Route:**
- `resources :comments` already provides `PATCH /comments/:id` — just needs the `update` action in the controller

### 3. Delete comment (soft-delete, author only)

**Behavior:**
- A "Delete" button is visible on each comment card, but only to the comment's author
- Clicking "Delete" immediately soft-deletes the comment (no confirmation dialog)
- The comment is replaced with a minimal tombstone

**Technical approach:**
- Add `removed_at` datetime column to `object_comments` table (null = active, set = removed)
- `destroy` action finds the comment, authorizes via `authorize @comment` (`ObjectCommentPolicy#destroy?` — author only), then sets `removed_at = Time.current`
- This replaces the current pattern of `authorize @resource, :show?` + scoped `find_by`
- Object references are NOT cleaned up on soft-delete — they remain intact in the database
- Object references are only cleaned up on hard-delete (`before_destroy` callback, for future pruning)
- The `after_commit` broadcast triggers a frame reload, which re-renders the comment as a tombstone
- Add a guard to `after_update :reconcile_object_references` to skip reconciliation when only `removed_at` changed (avoids a wasteful no-op)

**Tombstone display:**
- Minimal style: dashed border, muted colors, compact single line
- Text: "Comment by {author name} was removed · {time ago}"
- Small trash icon on the left
- No reactions shown on tombstones

### 4. Restore comment (author only)

**Behavior:**
- On the tombstone, the author sees a "Restore" button
- Other users see only the tombstone text (no action available)
- Clicking "Restore" clears `removed_at`, and the comment reappears as normal
- No re-reconciliation of object references needed (they were never cleaned up)

**Controller:**
- New `restore` action on `CommentsController`
- Finds the comment: `@comment = @resource.comments.find(params[:id])`
- Authorizes: `authorize @comment, :restore?`
- Sets `removed_at = nil` and saves

**Route:**
```ruby
resources :comments do
  post :restore, on: :member
end
```

### 5. Database migration

```ruby
add_column :object_comments, :removed_at, :datetime, null: true
```

No index needed — we're not filtering by `removed_at` in queries (all comments including removed ones are shown).

### 6. Authorization policy

Fix existing methods (bug — `=` → `==`):
- `update?` — `record.organization_membership == user_context.organization_membership`
- `destroy?` — `record.organization_membership == user_context.organization_membership`

Add:
- `restore?` — same logic as `update?`

### 7. View rendering logic

In `_comment.html.erb`:
- If `comment.removed_at.present?` → render tombstone partial (no `EditCommentPanel` / BlockNote editor — do not pass comment content to the frontend for removed comments)
- If `comment.removed_at.nil?` → render full comment card
- Edit/Delete buttons visible only when `policy(comment).update?` returns true
- Restore button on tombstone visible only when `policy(comment).restore?` returns true

### 8. Query scope

`load_comments` in the controller continues to load all comments ordered by `created_at`. No filtering of removed comments — tombstones are shown to everyone to preserve conversation flow.

## Out of scope

- Time-limited restore (future pruning job)
- Inline comments improvements
- Comment threading/replies
- Notification system for edits/deletes

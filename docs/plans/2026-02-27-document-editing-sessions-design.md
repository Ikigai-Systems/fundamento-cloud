# Document Editing Sessions — Author Tracking Design

## Problem

When a user saves a version of a document, we want to know who contributed to that version — both people who were present (had the document open) and people who actually made edits. Currently, `Version` only tracks `created_by` (the user who clicked save), with no visibility into other contributors.

## Solution

A new `DocumentEditingSession` model that records each time a user connects to and disconnects from the `DocumentChannel`. Sessions are linked to versions when versions are created.

## Data Model

### `document_editing_sessions` table

| Column           | Type     | Constraints                              |
|------------------|----------|------------------------------------------|
| `id`             | string   | NPI primary key                          |
| `document_id`    | string   | FK → documents, NOT NULL                 |
| `member_id`      | string   | FK → organization_memberships, NOT NULL  |
| `version_id`     | integer  | FK → versions, NULL                      |
| `connected_at`   | datetime | NOT NULL                                 |
| `disconnected_at`| datetime | NULL (filled on unsubscribe)             |
| `edited`         | boolean  | default: false                           |

**Indexes:**
- `(document_id, version_id)` — querying sessions for a version
- `(document_id, member_id)` — querying sessions for a user on a document
- `(member_id)` — querying all sessions for a member

**Why `member_id` instead of `user_id`:** Links to `OrganizationMembership` so records survive user removal from the organization. Also naturally scopes to the tenant context.

**Why `version_id` on the session (not a join table):** Each session belongs to at most one version. When a version is created, all unlinked sessions (`version_id IS NULL`) for that document are claimed by the new version. Simple, no extra tables.

**Long-running sessions:** If a user stays connected across multiple version saves, the first version claims their session. This is acceptable — in practice, version saves are infrequent relative to session duration, and the user will appear as a contributor on the version where they started.

## Lifecycle

### 1. Session creation (`DocumentChannel#subscribed`)

When a user subscribes to the document channel:
- Look up the user's `OrganizationMembership` for the current organization
- Create a `DocumentEditingSession` with `connected_at = Time.current`, `edited = false`
- Store the session ID on the channel instance (e.g., `@editing_session_id`) for later updates

### 2. Edit tracking (`DocumentChannel#receive`)

When the channel receives a Y.js update from the user:
- If `@marked_as_edited` is not set, update the session: `edited = true`
- Set `@marked_as_edited = true` to avoid repeated DB writes on every keystroke

### 3. Session close (`DocumentChannel#unsubscribed`)

When the user disconnects:
- Update the session: `disconnected_at = Time.current`

### 4. Version creation (`Documents::VersionsController#create`)

When a version is saved:
- After creating the version, claim all unlinked sessions:
  ```ruby
  document.editing_sessions.where(version_id: nil).update_all(version_id: @version.id)
  ```

## Model Associations

### `DocumentEditingSession`

```ruby
class DocumentEditingSession < ApplicationRecord
  belongs_to :document
  belongs_to :member, class_name: "OrganizationMembership"
  belongs_to :version, optional: true

  scope :editors, -> { where(edited: true) }
  scope :unlinked, -> { where(version_id: nil) }
end
```

### `Version` (additions)

```ruby
has_many :editing_sessions, class_name: "DocumentEditingSession"
has_many :editor_sessions, -> { where(edited: true) }, class_name: "DocumentEditingSession"
```

### `Document` (additions)

```ruby
has_many :editing_sessions, class_name: "DocumentEditingSession"
```

### `OrganizationMembership` (additions)

```ruby
has_many :editing_sessions, class_name: "DocumentEditingSession",
         foreign_key: :member_id, dependent: :delete_all
```

## DocumentChannel Changes

```ruby
class DocumentChannel < ApplicationCable::Channel
  include Y::Actioncable::Sync

  def subscribed
    document_id = params[:documentId]
    document = find_document(document_id)

    unless document && authorized_to_update?(document)
      reject
      return
    end

    membership = current_organization.organization_memberships
      .find_by(user: current_user)

    @editing_session = DocumentEditingSession.create!(
      document: document,
      member: membership,
      connected_at: Time.current
    )

    sync_from("document/#{document_id}") do |_|
      persist do |_, update|
        save_doc(document_id, update)
      end
    end
  end

  def receive(data)
    document_id = params[:documentId]
    sync("document/#{document_id}", data)

    unless @marked_as_edited
      @editing_session&.update_columns(edited: true)
      @marked_as_edited = true
    end
  end

  def unsubscribed
    @editing_session&.update_columns(disconnected_at: Time.current)
  end

  # ... existing private methods unchanged
end
```

## VersionsController Changes

```ruby
def create
  authorize @document, :update?

  content_blocks = JSON.parse(params["content_blocks"].to_s)

  @version = @document.versions.new
  @version.content_blocks = content_blocks
  @version.created_by = current_user

  if @version.save
    # Claim all unlinked editing sessions for this document
    @document.editing_sessions.unlinked.update_all(version_id: @version.id)

    respond_to do |format|
      flash[:notice] = "Document has been updated."
      format.html { redirect_to document_path(@document) }
    end
  else
    render :new, status: :unprocessable_content
  end
end
```

## Testing

### Model spec: `spec/models/document_editing_session_spec.rb`

- Associations: `belongs_to :document`, `belongs_to :member`, `belongs_to :version` (optional)
- Scopes: `.editors` returns only sessions with `edited: true`
- Scopes: `.unlinked` returns only sessions with `version_id: nil`
- NPI primary key: verify `id` is a string

### Channel spec: `spec/channels/document_channel_spec.rb` (extend existing)

- On subscribe: creates a `DocumentEditingSession` with `connected_at` set and `edited: false`
- On subscribe with unauthorized user: does not create a session
- On receive: sets `edited: true` on the session (first receive only)
- On unsubscribe: sets `disconnected_at` on the session

### Request spec: `spec/requests/documents/versions_controller_spec.rb` (extend or create)

- Creating a version claims all unlinked editing sessions for that document
- Creating a version does not claim sessions already linked to a previous version
- Creating a version does not claim sessions from other documents
- Contributors can be queried via `version.editing_sessions` and `version.editor_sessions`

### Fixture: `spec/fixtures/document_editing_sessions.yml`

- At least 2-3 fixture sessions covering: linked to a version, unlinked, edited vs present-only

### E2E test (Cypress)

Multi-version scenario with changing contributors. Uses 3 users (e.g., Sarah, James, Maria from dev seeds) and a shared document.

**Version 1 — Two editors:**
1. Sarah opens the document, types some text
2. James opens the same document, types some text
3. Sarah saves a version
4. Verify version 1 has 2 editing sessions, both marked as `edited: true`
5. Verify both Sarah and James are listed as contributors

**Version 2 — One editor, one viewer:**
1. Maria opens the document (but does not type)
2. Sarah types more text
3. Sarah saves a version
4. Verify version 2 has 2 editing sessions (Sarah edited, Maria present-only)
5. Verify Sarah is listed as an editor, Maria as present but not editor

**Version 3 — Solo editor, previous users gone:**
1. James and Maria close the document (disconnect)
2. Sarah is still connected but has not typed since version 2
3. James reconnects and types some text
4. James saves a version
5. Verify version 3 has James as editor
6. Verify Sarah does NOT appear in version 3 (her session was claimed by version 2)

**Cross-version integrity checks:**
- Verify total editing session count matches expected total across all versions
- Verify no session is linked to more than one version
- Verify sessions from version 1 are not affected by later version saves
- Verify unlinked sessions (`version_id: nil`) only exist for activity after the last version save

## Migration

```ruby
class CreateDocumentEditingSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :document_editing_sessions, id: :string do |t|
      t.references :document, null: false, foreign_key: true, type: :string
      t.references :member, null: false, foreign_key: { to_table: :organization_memberships }, type: :string
      t.references :version, null: true, foreign_key: true, type: :integer

      t.datetime :connected_at, null: false
      t.datetime :disconnected_at
      t.boolean :edited, default: false, null: false

      t.timestamps
    end

    add_index :document_editing_sessions, [:document_id, :version_id]
    add_index :document_editing_sessions, [:document_id, :member_id]
  end
end
```

## Future Enhancements

These are out of scope for the initial implementation but worth noting:

- **Per-update tracking**: Store each Y.js update with `user_id` for per-character attribution
- **Y.js `clientID` mapping**: Store `clientID → member_id` mapping per session to enable Y.js-native attribution (via `PermanentUserData` or `AttributionManager`)
- **Session splitting**: When a version is saved, close the current session and open a new one for users still connected — enables more precise attribution across versions
- **Y.js snapshots**: Store `Y.encodeSnapshot(doc)` on each version for document reconstruction and diffing (requires disabling Y.js GC or accepting degradation over time)

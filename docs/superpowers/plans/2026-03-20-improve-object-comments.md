# Improve Object Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cancel, edit, soft-delete, and restore functionality to object comments on documents and tables.

**Architecture:** Soft-delete via `removed_at` column, inline BlockNote editor toggle for editing, Turbo Frame manipulation for cancel/show/hide, author-only actions via Pundit policy.

**Tech Stack:** Rails 8.1, Turbo Frames, BlockNote editor (React), Pundit, RSpec request specs

**Spec:** `docs/superpowers/specs/2026-03-20-improve-object-comments-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/policies/object_comment_policy.rb` | Modify | Fix `=`→`==` bug, add `restore?` |
| `spec/policies/object_comment_policy_spec.rb` | Create | Policy specs |
| `db/migrate/XXXXXX_add_removed_at_to_object_comments.rb` | Create | Add `removed_at` column |
| `app/models/object_comment.rb` | Modify | Guard reconciler on soft-delete, add `removed?` helper |
| `spec/fixtures/object_comments.yml` | Create | Test fixtures |
| `app/controllers/comments_controller.rb` | Modify | Add `update`, `restore`, rewrite `destroy` |
| `config/routes.rb` | Modify | Add `restore` member route |
| `spec/requests/comments_controller_spec.rb` | Create | Request specs for all actions |
| `app/views/comments/_frames.html.erb` | Modify | CSS sibling selector to hide button when form present |
| `app/views/comments/new.html.erb` | Modify | Add Cancel button (client-side frame clear) |
| `app/views/comments/_comment.html.erb` | Modify | Tombstone branch, pass props for React edit/delete |
| `app/javascript/components/EditCommentPanel.tsx` | Modify | Add editing state, save/cancel, edit/delete buttons (React-owned) |
| `app/javascript/components/editor/CommentEditor.tsx` | Modify | Accept reactive editable, expose editor ref via forwardRef |
| `spec/e2e/cypress/e2e/documents/document-comments.cy.js` | Create | E2E tests for CRUD and real-time Turbo Stream broadcasts |

---

## Task 1: Fix policy bug and add `restore?`

**Files:**
- Modify: `app/policies/object_comment_policy.rb:16-22`
- Create: `spec/policies/object_comment_policy_spec.rb`
- Create: `spec/fixtures/object_comments.yml`

- [ ] **Step 1: Create object_comments fixture**

Create `spec/fixtures/object_comments.yml`:

```yaml
one:
  organization_id: "is"
  organization_membership_id: "om_is_pawel"
  object_type: "Document"
  object_id: "one"
  content: '<%= [{"type":"paragraph","content":[{"type":"text","text":"Test comment"}]}].to_json %>'
  created_at: <%= 1.hour.ago.iso8601 %>
  updated_at: <%= 1.hour.ago.iso8601 %>
```

- [ ] **Step 2: Write the policy spec**

Create `spec/policies/object_comment_policy_spec.rb`. Follow the codebase pattern from `spec/policies/space_policy_spec.rb` — use `PolicyUserContext.new(user, organization)`:

```ruby
require "rails_helper"

RSpec.describe ObjectCommentPolicy, type: :policy do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_comments

  let(:comment) { object_comments(:one) }

  describe "#update?" do
    it "allows the comment author" do
      membership = organization_memberships(:om_is_pawel)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.update?).to be true
    end

    it "denies a different member" do
      membership = organization_memberships(:om_is_stefan)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.update?).to be false
    end
  end

  describe "#destroy?" do
    it "allows the comment author" do
      membership = organization_memberships(:om_is_pawel)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.destroy?).to be true
    end

    it "denies a different member" do
      membership = organization_memberships(:om_is_stefan)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.destroy?).to be false
    end
  end

  describe "#restore?" do
    it "allows the comment author" do
      membership = organization_memberships(:om_is_pawel)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.restore?).to be true
    end

    it "denies a different member" do
      membership = organization_memberships(:om_is_stefan)
      policy = described_class.new(PolicyUserContext.new(membership.user, membership.organization), comment)
      expect(policy.restore?).to be false
    end
  end
end
```

- [ ] **Step 3: Run specs to verify they fail**

Run: `bin/rspec spec/policies/object_comment_policy_spec.rb`
Expected: Failures — `update?` and `destroy?` return truthy for non-authors (due to the `=` bug), and `restore?` is undefined.

- [ ] **Step 4: Fix the policy**

In `app/policies/object_comment_policy.rb`, change:

```ruby
  def update?
    record.organization_membership = user_context.organization_membership
  end

  def destroy?
    record.organization_membership = user_context.organization_membership
  end
```

to:

```ruby
  def update?
    record.organization_membership == user_context.organization_membership
  end

  def destroy?
    record.organization_membership == user_context.organization_membership
  end

  def restore?
    record.organization_membership == user_context.organization_membership
  end
```

- [ ] **Step 5: Run specs to verify they pass**

Run: `bin/rspec spec/policies/object_comment_policy_spec.rb`
Expected: All 6 examples pass.

- [ ] **Step 6: Commit**

```bash
git add spec/policies/object_comment_policy_spec.rb spec/fixtures/object_comments.yml app/policies/object_comment_policy.rb
git commit -m "Fix ObjectCommentPolicy = vs == bug, add restore? method"
```

---

## Task 2: Add `removed_at` column and model changes

**Files:**
- Create: `db/migrate/XXXXXX_add_removed_at_to_object_comments.rb`
- Modify: `app/models/object_comment.rb`

- [ ] **Step 1: Generate migration**

Run: `bin/rails generate migration AddRemovedAtToObjectComments removed_at:datetime`

- [ ] **Step 2: Verify migration content**

The generated migration should contain:

```ruby
class AddRemovedAtToObjectComments < ActiveRecord::Migration[8.1]
  def change
    add_column :object_comments, :removed_at, :datetime
  end
end
```

- [ ] **Step 3: Run migration**

Run: `bin/rails db:migrate`

- [ ] **Step 4: Add `removed?` helper and guard reconciler**

In `app/models/object_comment.rb`:

Add after `validates_presence_of :content`:

```ruby
  def removed?
    removed_at.present?
  end
```

Change only the `after_update` line from:

```ruby
  after_update :reconcile_object_references
```

to:

```ruby
  after_update :reconcile_object_references, unless: :removed?
```

Leave `after_create :reconcile_object_references` unchanged.

- [ ] **Step 5: Commit**

```bash
git add db/migrate/*_add_removed_at_to_object_comments.rb app/models/object_comment.rb db/schema.rb
git commit -m "Add removed_at column to object_comments for soft-delete"
```

---

## Task 3: Controller actions — `update`, `destroy` (rewrite), `restore`

**Files:**
- Modify: `app/controllers/comments_controller.rb`
- Modify: `config/routes.rb:123`
- Create: `spec/requests/comments_controller_spec.rb`

- [ ] **Step 1: Write request specs**

Create `spec/requests/comments_controller_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe CommentsController, type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents, :object_comments

  let(:author) { users(:pawel) }
  let(:other_user) { users(:stefan) }
  let(:organization) { organizations(:is) }
  let(:document) { documents(:one) }
  let(:comment) { object_comments(:one) }

  let(:turbo_headers) { { "Turbo-Frame" => "object_comments" } }

  describe "PATCH #update" do
    let(:new_content) { [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Updated" }] }] }

    context "as the comment author" do
      before do
        sign_in author
        post select_organization_path(organization)
      end

      it "updates the comment content" do
        patch comment_path(comment, object_gid: document.to_gid_param),
          params: { comment: { content: new_content.to_json } },
          headers: turbo_headers

        expect(response).to have_http_status(:ok)
        expect(comment.reload.content).to eq(new_content)
      end
    end

    context "as a different user" do
      before do
        sign_in other_user
        post select_organization_path(organization)
      end

      it "is forbidden" do
        patch comment_path(comment, object_gid: document.to_gid_param),
          params: { comment: { content: [].to_json } },
          headers: turbo_headers

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE #destroy" do
    context "as the comment author" do
      before do
        sign_in author
        post select_organization_path(organization)
      end

      it "soft-deletes the comment by setting removed_at" do
        delete comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:no_content)
        expect(comment.reload.removed_at).to be_present
        expect(comment.reload).to be_persisted
      end
    end

    context "as a different user" do
      before do
        sign_in other_user
        post select_organization_path(organization)
      end

      it "is forbidden" do
        delete comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST #restore" do
    before do
      comment.update_column(:removed_at, Time.current)
    end

    context "as the comment author" do
      before do
        sign_in author
        post select_organization_path(organization)
      end

      it "restores the comment by clearing removed_at" do
        post restore_comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:no_content)
        expect(comment.reload.removed_at).to be_nil
      end
    end

    context "as a different user" do
      before do
        sign_in other_user
        post select_organization_path(organization)
      end

      it "is forbidden" do
        post restore_comment_path(comment, object_gid: document.to_gid_param),
          headers: turbo_headers

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
```

Note: Check how the app handles `Pundit::NotAuthorizedError` — it likely renders 403 via `ApplicationController`, but verify by checking `rescue_from Pundit::NotAuthorizedError` in the controller chain. Adapt the expected status code if needed.

- [ ] **Step 2: Run specs to verify they fail**

Run: `bin/rspec spec/requests/comments_controller_spec.rb`
Expected: Failures — `update`, `restore` actions don't exist, `destroy` still hard-deletes.

- [ ] **Step 3: Add routes**

In `config/routes.rb`, change:

```ruby
    resources :comments
```

to:

```ruby
    resources :comments do
      post :restore, on: :member
    end
```

- [ ] **Step 4: Implement controller actions**

Rewrite `app/controllers/comments_controller.rb`:

```ruby
class CommentsController < ApplicationController
  include EnsureOrganization

  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_resource
  before_action :ensure_turbo_request, except: [:show]

  def index
    authorize @resource, :show?

    @comments = load_comments
  end

  def new
    authorize @resource, :create?

    @comment = @resource.comments.new
  end

  def create
    @comment = @resource.comments.new(create_params)
    @comment.organization = current_organization
    @comment.organization_membership = current_organization_membership

    authorize @resource, :create?

    if @comment.save
      render turbo_stream: turbo_stream.update("new_object_comment", "")
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @comment = @resource.comments.find(params[:id])
    authorize @comment

    @comment.update!(update_params)

    head :ok
  end

  def destroy
    @comment = @resource.comments.find(params[:id])
    authorize @comment

    @comment.update!(removed_at: Time.current)

    render html: "", status: :no_content
  end

  def restore
    @comment = @resource.comments.find(params[:id])
    authorize @comment

    @comment.update!(removed_at: nil)

    render html: "", status: :no_content
  end

  def show
    authorize @resource, :show?

    @reaction = @resource.comments.find(params[:id])
    @comments = @resource.comments.where(emoji: @reaction.emoji).order(created_at: :desc)
  end

  protected

  def load_comments
    @resource.comments.order(:created_at)
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(@resource) unless turbo_frame_request?
  end

  def create_params
    params.require(:comment).permit(:content)
  end

  def update_params
    params.require(:comment).permit(:content)
  end

  def load_resource
    if params[:object_gid]
      @resource = GlobalID::Locator.locate(params[:object_gid], only: ObjectComment::ALLOWED_OBJECT_TYPES.map(&:constantize))

      if @resource.nil? || @resource.organization != current_organization
        return head :unprocessable_entity
      end
    else
      unless ObjectComment::ALLOWED_OBJECT_TYPES.include?(params[:object_type])
        return head :unprocessable_entity
      end

      @resource = params[:object_type].constantize.
        find_by_param!(params[:object_id])
    end
  end
end
```

- [ ] **Step 5: Run specs to verify they pass**

Run: `bin/rspec spec/requests/comments_controller_spec.rb`
Expected: All examples pass.

- [ ] **Step 6: Commit**

```bash
git add app/controllers/comments_controller.rb config/routes.rb spec/requests/comments_controller_spec.rb
git commit -m "Add update, soft-delete, and restore actions to CommentsController"
```

---

## Task 4: View changes — cancel button, hide Comment button, tombstone

**Files:**
- Modify: `app/views/comments/_frames.html.erb`
- Modify: `app/views/comments/new.html.erb`
- Modify: `app/views/comments/_comment.html.erb`

- [ ] **Step 1: Update `_frames.html.erb` — CSS sibling selector for Comment button visibility**

The Comment button must hide when the form opens and reappear when cancelled/submitted. Use a CSS sibling selector: when the `new_object_comment` Turbo Frame has content, the adjacent `add_object_comment` frame is hidden. When the form clears (cancel or submit), the button reappears automatically.

Replace `app/views/comments/_frames.html.erb`:

```erb
<div class="m-3 flex flex-col gap-3">
  <%= turbo_frame_tag "object_comments", src: comments_path(object_gid: resource.to_gid_param), loading: "lazy" %>

  <% if policy(resource.comments.new).create? %>
    <div>
      <%= turbo_frame_tag "new_object_comment" %>

      <%= turbo_frame_tag "add_object_comment" do %>
        <%= link_to(
              new_comment_path(object_gid: resource.to_gid_param),
              data: { turbo_frame: "new_object_comment" },
              class: "secondary-button gap-1"
            ) do
        %>
          <i class="fa fa-comment"></i>
          Comment
        <% end %>
      <% end %>
    </div>
  <% end %>
</div>
```

Add CSS rule (in the relevant stylesheet or a `<style>` tag in the partial):

```css
turbo-frame#new_object_comment:not(:empty) + turbo-frame#add_object_comment {
  display: none;
}
```

This works because Turbo Frames are regular DOM elements — the `:not(:empty)` pseudo-class and `+` sibling combinator apply normally. When the form loads into the frame, it becomes non-empty and the adjacent button frame hides. When the frame is cleared (cancel or successful submit), it becomes empty and the button reappears.

- [ ] **Step 2: Add client-side Cancel button to new comment form**

Cancel works entirely client-side — it just clears the `new_object_comment` Turbo Frame's content. No server round-trip needed.

In `app/views/comments/new.html.erb`, change:

```erb
      <div>
        <%= f.submit "Add", class: "primary-button" %>
      </div>
```

to:

```erb
      <div class="flex gap-2">
        <%= f.submit "Add", class: "primary-button" %>
        <button type="button"
                class="secondary-button"
                onclick="this.closest('turbo-frame').innerHTML = ''">
          Cancel
        </button>
      </div>
```

The `onclick` finds the closest `turbo-frame` ancestor (which is `#new_object_comment`) and clears it. This triggers the CSS sibling selector to show the Comment button again.

- [ ] **Step 3: Update `_comment.html.erb` — tombstone branch and edit/delete props**

The edit/delete buttons will live inside the React `EditCommentPanel` component (React owns the interaction, no Stimulus↔React bridge needed). The ERB template passes `comment_id` and `object_gid` as props — the React component renders the buttons and handles edit state.

Replace `app/views/comments/_comment.html.erb`:

```erb
<% if comment.removed? %>
  <div class="rounded-xl border border-dashed flex flex-row gap-2 items-center px-3 py-2 text-sm text-gray-400">
    <i class="fa fa-trash text-xs"></i>
    <span>
      Comment by <strong class="text-gray-500"><%= comment.organization_membership.display_name %></strong>
      was removed
      <time class="underline decoration-dotted"
            datetime="<%= comment.removed_at.iso8601 %>"
            data-controller="timestamp"
            data-timestamp-datetime-value="<%= comment.removed_at.iso8601 %>">
        <%= time_ago_in_words comment.removed_at %> ago
      </time>
    </span>

    <% if policy(comment).restore? %>
      <%= button_to "Restore",
            restore_comment_path(comment, object_gid: resource.to_gid_param),
            method: :post,
            class: "ml-auto text-sm text-blue-600 hover:text-blue-800 underline",
            data: { turbo_frame: "object_comments" } %>
    <% end %>
  </div>
<% else %>
  <div class="rounded-xl border flex flex-col sidebar-colors pt-3">
    <div class="flex flex-row gap-3 pl-3 pb-3 items-center">
      <%= render UserAvatar.new(organization_membership: comment.organization_membership) %>

      <div class="flex flex-col">
        <span class="font-semibold"><%= comment.organization_membership.display_name %></span>

        <time class="text-sm/6 text-gray-900 dark:text-gray-100 underline decoration-dotted"
              datetime="<%= comment.created_at.iso8601 %>"
              data-controller="timestamp"
              data-timestamp-datetime-value="<%= comment.created_at.iso8601 %>">
          <%= time_ago_in_words comment.created_at %>
        </time>
      </div>
    </div>

    <div>
      <%= react_component "EditCommentPanel", {
        object: resource.to_react_props,
        comment: comment.content,
        editable: false,
        space: space.to_react_props,
        comment_id: (comment.id if policy(comment).update?),
        object_gid: (resource.to_gid_param if policy(comment).update?),
      } %>
    </div>

    <%= turbo_frame_tag comment, :reactions, src: reactions_path(object_gid: comment.to_gid_param), loading: "lazy" %>
  </div>
<% end %>
```

Key changes from the original:
- Tombstone branch when `comment.removed?`
- Removed edit/delete buttons from ERB (moved to React)
- Pass `comment_id` and `object_gid` as props (only for the author, guarded by `policy(comment).update?`)
- Do NOT pass `comment.content` for removed comments (tombstone branch skips it entirely)

- [ ] **Step 4: Verify views render without errors**

Start the dev server (`bin/dev`) and navigate to a document with comments. Verify:
- Comments render normally, no errors in Rails logs
- The Comment button hides when the form opens and reappears on Cancel

- [ ] **Step 5: Commit**

```bash
git add app/views/comments/_frames.html.erb app/views/comments/new.html.erb app/views/comments/_comment.html.erb
git commit -m "Add client-side cancel, comment button toggle, tombstone, and edit/delete props"
```

---

## Task 5: React changes — editable toggle, save, cancel, edit/delete buttons

**Files:**
- Modify: `app/javascript/components/EditCommentPanel.tsx`
- Modify: `app/javascript/components/editor/CommentEditor.tsx`

- [ ] **Step 1: Update CommentEditor to expose editor via forwardRef**

In `app/javascript/components/editor/CommentEditor.tsx`, wrap in `forwardRef` and expose editor content access via `useImperativeHandle`:

```tsx
import {useMemo, useImperativeHandle, forwardRef} from "react";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import schema from "./schema";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import LoadingContent from "./LoadingContent.tsx";
import {CommonSuggestionMenus} from "./CommonSuggestionMenus.tsx";

type CommentEditorProps = {
  objectId: number,
  comment: any,
  editable?: boolean,
}

export type CommentEditorHandle = {
  getContent: () => any;
  replaceContent: (content: any) => void;
}

const CommentEditor = forwardRef<CommentEditorHandle, CommentEditorProps>(
  ({objectId, comment, editable = true}, ref) => {
    const editor = useMemo(() => {
      const commentEditor = BlockNoteEditor.create({
        schema,
        initialContent: comment,
        uploadFile: uploadFile(objectId),
        resolveFileUrl: createFileUrlResolver(),
      });

      if (editable) {
        window.commentEditor = commentEditor;
      }

      return commentEditor;
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => editor.document,
      replaceContent: (content: any) => {
        editor.replaceBlocks(editor.document, content);
      },
    }), [editor]);

    if (editor === undefined) {
      return <LoadingContent/>
    }

    return <>
      <BlockNoteView editor={editor} slashMenu={false} sideMenu={false} editable={editable} data-comment-editor>
        <CommonSuggestionMenus editor={editor}/>
      </BlockNoteView>
    </>
  }
);

export default CommentEditor;
```

Key changes:
- Wrapped in `forwardRef`
- Added `useImperativeHandle` to expose `getContent()` and `replaceContent()` methods
- Exported `CommentEditorHandle` type
- `editable` prop is reactive — `BlockNoteView` handles toggling `editor.isEditable` internally via its own `useEffect`

- [ ] **Step 2: Update EditCommentPanel with editing state and edit/delete buttons**

The edit and delete buttons live inside this React component, not in ERB. This avoids needing a Stimulus↔React bridge. The `comment_id` and `object_gid` props are only passed for the comment author (guarded by policy in ERB).

Replace `app/javascript/components/EditCommentPanel.tsx`:

```tsx
import {useState, useRef, useCallback} from "react";
import {Document, Space, Table} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import CommentEditor, {CommentEditorHandle} from "./editor/CommentEditor.tsx";

type EditCommentPanelProps = {
  object: Document | Table,
  space: Space,
  editable?: boolean,
  comment?: any,
  comment_id?: string,
  object_gid?: string,
}

const EditCommentPanel = ({object, space, editable, comment, comment_id, object_gid}: EditCommentPanelProps) => {
  const [editing, setEditing] = useState(editable ?? false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<CommentEditorHandle>(null);
  const snapshotRef = useRef<any>(null);

  const canEdit = !!comment_id && !!object_gid;

  const startEditing = useCallback(() => {
    if (editorRef.current) {
      snapshotRef.current = structuredClone(editorRef.current.getContent());
    }
    setEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    if (editorRef.current && snapshotRef.current) {
      editorRef.current.replaceContent(snapshotRef.current);
    }
    setEditing(false);
  }, []);

  const saveComment = useCallback(async () => {
    if (!editorRef.current || !comment_id || !object_gid) return;

    setSaving(true);
    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
      const content = editorRef.current.getContent();

      const response = await fetch(`/comments/${comment_id}?object_gid=${encodeURIComponent(object_gid)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
          "Turbo-Frame": "object_comments",
        },
        body: JSON.stringify({ comment: { content: JSON.stringify(content) } }),
      });

      if (response.ok) {
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }, [comment_id, object_gid]);

  const deleteComment = useCallback(async () => {
    if (!comment_id || !object_gid) return;

    const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

    await fetch(`/comments/${comment_id}?object_gid=${encodeURIComponent(object_gid)}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken || "",
        "Turbo-Frame": "object_comments",
      },
    });
  }, [comment_id, object_gid]);

  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      {canEdit && !editing && (
        <div className="flex gap-2 justify-end pr-3 -mt-1 mb-1">
          <button onClick={startEditing} className="text-sm text-gray-400 hover:text-gray-600" title="Edit">
            <i className="fa fa-pencil"></i>
          </button>
          <button onClick={deleteComment} className="text-sm text-gray-400 hover:text-red-600" title="Delete">
            <i className="fa fa-trash"></i>
          </button>
        </div>
      )}
      <CommentEditor
        ref={editorRef}
        objectId={object.id}
        editable={editing}
        comment={comment}
      />
      {canEdit && editing && (
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={saveComment} disabled={saving} className="primary-button text-sm">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={cancelEditing} disabled={saving} className="secondary-button text-sm">
            Cancel
          </button>
        </div>
      )}
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditCommentPanel;
```

Key decisions:
- `comment_id` and `object_gid` are passed as separate props from ERB (only for the author)
- Edit/Delete buttons are rendered by React, not ERB — avoids Stimulus↔React bridge
- `object_gid` is passed as a string from ERB (`resource.to_gid_param`), not derived from `to_react_props` (which doesn't include `gid`)
- Save uses `fetch` with CSRF token from `<meta>` tag
- Delete uses `fetch` — the `after_commit` broadcast on the model triggers a Turbo Frame reload to show the tombstone
- `comment_id` is a `string` type (NPI IDs are strings in this codebase)

- [ ] **Step 3: Verify editing works in the browser**

Start `bin/dev`, navigate to a document with comments where you are the author. Verify:
- Edit/Delete buttons appear on your comments only (small icons in top-right area)
- Clicking Edit makes the editor editable with Save/Cancel buttons
- Cancel reverts changes
- Save persists changes (check Rails logs for PATCH request)
- Delete shows the tombstone (check that `after_commit` broadcast reloads the frame)
- Other users don't see edit/delete buttons

- [ ] **Step 4: Commit**

```bash
git add app/javascript/components/EditCommentPanel.tsx app/javascript/components/editor/CommentEditor.tsx
git commit -m "Add inline edit toggle with save/cancel and delete to comment editor"
```

---

## Task 6: Integration testing and polish

- [ ] **Step 1: Run all existing specs to check for regressions**

Run: `bin/rspec spec/policies/object_comment_policy_spec.rb spec/requests/comments_controller_spec.rb`
Expected: All pass.

- [ ] **Step 2: End-to-end manual verification**

Test all flows in the browser:
1. Open a document → click "Comment" → verify button hides → click "Cancel" → verify button reappears
2. Add a comment → verify it renders → verify no edit/delete buttons for other users
3. As the author, click Edit → modify content → Save → verify content updated
4. As the author, click Edit → modify content → Cancel → verify content reverted
5. As the author, click Delete → verify tombstone renders with "Restore" button
6. Click Restore → verify comment reappears
7. As a different user, verify tombstone has no Restore button
8. Verify the same flows work on a Table's comments

Use `bin/browser-session-for` to test with multiple users simultaneously.

- [ ] **Step 3: Fix any issues discovered**

Address any bugs found during manual testing.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "Polish comment improvements after integration testing"
```

---

## Task 7: E2E tests — comments CRUD and real-time broadcasts

**Files:**
- Create: `spec/e2e/cypress/e2e/documents/document-comments.cy.js`

E2E tests verify the full stack including Turbo Stream broadcasts. The key scenario that only E2E can test: User A adds/edits/deletes a comment, and User B sees the update in real-time via ActionCable broadcast without refreshing.

Follow the patterns in `spec/e2e/cypress/e2e/documents/document-reactions.cy.js`:
- `cy.appEval` for backend mutations (simulating another user)
- `cy.intercept("GET", "/comments*").as("getComments")` + `cy.wait("@getComments")` for broadcast-triggered frame reloads
- Turbo Stream broadcasts trigger `reload_turbo_frame` on `#object_comments`, which fires a GET to `/comments?object_gid=...`

- [ ] **Step 1: Write E2E spec**

Create `spec/e2e/cypress/e2e/documents/document-comments.cy.js`:

```js
import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Comments", function () {
  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  const documentId = "two";
  const waitForEditor = () => {
    cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");
  };

  // Helper to create a comment via backend
  const createComment = (membershipId, text) => {
    return cy.appEval(`
      document = Document.find('${documentId}')
      membership = OrganizationMembership.find('${membershipId}')
      content = [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "${text}"}]}]
      comment = document.comments.create!(
        organization: document.organization,
        organization_membership: membership,
        content: content
      )
      comment.id
    `);
  };

  describe("adding comments", function () {
    it("shows and hides the comment form with Cancel", function () {
      cy.visit(`/d/${documentId}`);
      waitForEditor();

      // Comment button should be visible
      cy.contains("Comment").should("be.visible");

      // Click Comment to open form
      cy.contains("Comment").click();

      // Form should appear, Comment button should hide
      cy.get("turbo-frame#new_object_comment").should("not.be.empty");
      cy.get("turbo-frame#add_object_comment").should("not.be.visible");

      // Click Cancel
      cy.contains("button", "Cancel").click();

      // Form should clear, Comment button should reappear
      cy.get("turbo-frame#new_object_comment").should("be.empty");
      cy.contains("Comment").should("be.visible");
    });

    it("adds a comment and displays it", function () {
      cy.visit(`/d/${documentId}`);
      waitForEditor();

      cy.contains("Comment").click();

      // Type in the BlockNote editor inside the new comment form
      cy.get("turbo-frame#new_object_comment [data-comment-editor] [role='textbox']", {timeout: 5000})
        .click()
        .type("This is a test comment");

      cy.intercept("POST", "/comments*").as("createComment");
      cy.intercept("GET", "/comments*").as("getComments");

      cy.contains("button", "Add").click();

      cy.wait("@createComment");
      cy.wait("@getComments");

      // Comment should appear in the list
      cy.get("turbo-frame#object_comments").should("contain", "This is a test comment");

      // Comment button should reappear (form cleared)
      cy.contains("Comment").should("be.visible");
    });
  });

  describe("real-time updates from another user", function () {
    it("shows a new comment from another user in real-time", function () {
      cy.visit(`/d/${documentId}`);
      waitForEditor();

      // Intercept the broadcast-triggered frame reload
      cy.intercept("GET", "/comments*").as("getComments");

      // Another user (stefan) adds a comment via backend
      createComment("om_is_stefan", "Hello from Stefan!");

      cy.wait("@getComments");

      // The comment should appear without page refresh
      cy.get("turbo-frame#object_comments").should("contain", "Hello from Stefan!");
    });

    it("shows updated comment content from another user in real-time", function () {
      // Create a comment by stefan first
      createComment("om_is_stefan", "Original text").then((commentId) => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        // Verify original comment is displayed
        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Original text");

        // Intercept the broadcast-triggered frame reload
        cy.intercept("GET", "/comments*").as("getComments");

        // Stefan updates the comment via backend
        cy.appEval(`
          comment = ObjectComment.find('${commentId}')
          comment.update!(content: [{"type" => "paragraph", "content" => [{"type" => "text", "text" => "Updated by Stefan"}]}])
        `);

        cy.wait("@getComments");

        // Updated content should appear
        cy.get("turbo-frame#object_comments").should("contain", "Updated by Stefan");
        cy.get("turbo-frame#object_comments").should("not.contain", "Original text");
      });
    });

    it("shows tombstone when another user deletes their comment in real-time", function () {
      // Create a comment by stefan
      createComment("om_is_stefan", "Will be deleted").then((commentId) => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        // Verify comment is displayed
        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Will be deleted");

        // Intercept the broadcast-triggered frame reload
        cy.intercept("GET", "/comments*").as("getComments");

        // Stefan soft-deletes via backend
        cy.appEval(`
          comment = ObjectComment.find('${commentId}')
          comment.update!(removed_at: Time.current)
        `);

        cy.wait("@getComments");

        // Tombstone should appear, original text should be gone
        cy.get("turbo-frame#object_comments").should("contain", "was removed");
        cy.get("turbo-frame#object_comments").should("not.contain", "Will be deleted");

        // Pawel (not the author) should NOT see a Restore button
        cy.get("turbo-frame#object_comments").should("not.contain", "Restore");
      });
    });
  });

  describe("edit and delete by author", function () {
    it("author can edit their comment inline", function () {
      // Create a comment by pawel
      createComment("om_is_pawel", "My original comment").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "My original comment");

        // Edit button should be visible (author)
        cy.get("[title='Edit']").should("exist");

        // Click Edit
        cy.get("[title='Edit']").first().click();

        // Save/Cancel buttons should appear
        cy.contains("button", "Save").should("be.visible");
        cy.contains("button", "Cancel").should("be.visible");

        // Edit the content in the BlockNote editor
        cy.get("turbo-frame#object_comments [data-comment-editor] [role='textbox']")
          .clear()
          .type("My updated comment");

        cy.intercept("PATCH", "/comments/*").as("updateComment");
        cy.intercept("GET", "/comments*").as("getComments");

        cy.contains("button", "Save").click();

        cy.wait("@updateComment");
        cy.wait("@getComments");

        // Updated content should appear
        cy.get("turbo-frame#object_comments").should("contain", "My updated comment");
      });
    });

    it("author can cancel editing without losing original content", function () {
      createComment("om_is_pawel", "Do not change me").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Do not change me");

        // Click Edit
        cy.get("[title='Edit']").first().click();

        // Modify content
        cy.get("turbo-frame#object_comments [data-comment-editor] [role='textbox']")
          .clear()
          .type("Changed text");

        // Click Cancel
        cy.contains("button", "Cancel").click();

        // Original content should be restored
        cy.get("turbo-frame#object_comments").should("contain", "Do not change me");
      });
    });

    it("author can delete their comment and see tombstone with Restore", function () {
      createComment("om_is_pawel", "Will delete this").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Will delete this");

        cy.intercept("DELETE", "/comments/*").as("deleteComment");
        cy.intercept("GET", "/comments*").as("getComments");

        // Click Delete
        cy.get("[title='Delete']").first().click();

        cy.wait("@deleteComment");
        cy.wait("@getComments");

        // Tombstone should appear
        cy.get("turbo-frame#object_comments").should("contain", "was removed");
        cy.get("turbo-frame#object_comments").should("not.contain", "Will delete this");

        // Author should see Restore button
        cy.contains("Restore").should("be.visible");
      });
    });

    it("author can restore a deleted comment", function () {
      createComment("om_is_pawel", "Restore me").then((commentId) => {
        // Soft-delete the comment
        cy.appEval(`ObjectComment.find('${commentId}').update!(removed_at: Time.current)`);

        cy.visit(`/d/${documentId}`);
        waitForEditor();

        // Tombstone should be visible with Restore button
        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "was removed");
        cy.contains("Restore").should("be.visible");

        cy.intercept("POST", "/comments/*/restore").as("restoreComment");
        cy.intercept("GET", "/comments*").as("getComments");

        cy.contains("Restore").click();

        cy.wait("@restoreComment");
        cy.wait("@getComments");

        // Comment should reappear
        cy.get("turbo-frame#object_comments").should("contain", "Restore me");
        cy.get("turbo-frame#object_comments").should("not.contain", "was removed");
      });
    });
  });

  describe("authorization", function () {
    it("does not show edit/delete buttons for comments by other users", function () {
      // Create a comment by stefan
      createComment("om_is_stefan", "Stefan's comment").then(() => {
        cy.visit(`/d/${documentId}`);
        waitForEditor();

        cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Stefan's comment");

        // No edit/delete buttons should be visible for pawel viewing stefan's comment
        cy.get("[title='Edit']").should("not.exist");
        cy.get("[title='Delete']").should("not.exist");
      });
    });

    it("shows edit/delete only for own comments when multiple comments exist", function () {
      // Create comments by both users
      createComment("om_is_stefan", "Stefan's comment");
      createComment("om_is_pawel", "Pawel's comment");

      cy.visit(`/d/${documentId}`);
      waitForEditor();

      cy.get("turbo-frame#object_comments", {timeout: 10000}).should("contain", "Stefan's comment");
      cy.get("turbo-frame#object_comments").should("contain", "Pawel's comment");

      // Only one set of edit/delete buttons (for pawel's comment)
      cy.get("[title='Edit']").should("have.length", 1);
      cy.get("[title='Delete']").should("have.length", 1);
    });
  });
});
```

- [ ] **Step 2: Run the E2E spec (solo, ensure E2E env is up)**

```bash
bin/dev-e2e up --no-build
npx cypress run --project spec/e2e --spec "spec/e2e/cypress/e2e/documents/document-comments.cy.js" --config baseUrl=http://localhost:4000
```

Expected: All tests pass.

- [ ] **Step 3: Stability check — run 10 consecutive times**

```bash
for i in $(seq 1 10); do
  npx cypress run --project spec/e2e --spec "spec/e2e/cypress/e2e/documents/document-comments.cy.js" --config baseUrl=http://localhost:4000 || break
done
```

Expected: All 10 runs pass (no flaky tests).

- [ ] **Step 4: Fix any flaky tests**

Common E2E issues to watch for:
- Broadcast race conditions: if `cy.wait("@getComments")` fires before the intercept is registered, the test hangs. Ensure `cy.intercept` is called BEFORE the action that triggers the request.
- Turbo coalescing: rapid mutations may coalesce broadcasts. Use batch `appEval` for multiple mutations and assert final DOM state.
- Editor readiness: BlockNote editor may take time to mount. Wait for `[data-comment-editor] [role='textbox']` before typing.

- [ ] **Step 5: Commit**

```bash
git add spec/e2e/cypress/e2e/documents/document-comments.cy.js
git commit -m "Add E2E tests for comment CRUD and real-time Turbo Stream broadcasts"
```

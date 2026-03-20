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
| `app/controllers/comments_controller.rb` | Modify | Add `update`, `restore`, rewrite `destroy`, add `cancel` |
| `config/routes.rb` | Modify | Add `restore` member route, `cancel` collection route |
| `spec/requests/comments_controller_spec.rb` | Create | Request specs for all actions |
| `app/views/comments/_frames.html.erb` | Modify | Wrap button + form in Stimulus toggle controller |
| `app/views/comments/new.html.erb` | Modify | Add Cancel button, add Stimulus action to hide Comment button |
| `app/views/comments/cancel.html.erb` | Create | Empty frame response for cancel |
| `app/views/comments/_comment.html.erb` | Modify | Tombstone branch, pass props for React edit/delete |
| `app/javascript/components/EditCommentPanel.tsx` | Modify | Add editing state, save/cancel, edit/delete buttons (React-owned) |
| `app/javascript/components/editor/CommentEditor.tsx` | Modify | Accept reactive editable, expose editor ref via forwardRef |

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

## Task 3: Controller actions — `update`, `destroy` (rewrite), `restore`, `cancel`

**Files:**
- Modify: `app/controllers/comments_controller.rb`
- Modify: `config/routes.rb:123`
- Create: `app/views/comments/cancel.html.erb`
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
      get :cancel, on: :collection
    end
```

- [ ] **Step 4: Create cancel view**

Create `app/views/comments/cancel.html.erb`:

```erb
<%= turbo_frame_tag "new_object_comment" %>
```

This renders an empty Turbo Frame that clears the form.

- [ ] **Step 5: Implement controller actions**

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

  def cancel
    authorize @resource, :show?
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

- [ ] **Step 6: Run specs to verify they pass**

Run: `bin/rspec spec/requests/comments_controller_spec.rb`
Expected: All examples pass.

- [ ] **Step 7: Commit**

```bash
git add app/controllers/comments_controller.rb config/routes.rb app/views/comments/cancel.html.erb spec/requests/comments_controller_spec.rb
git commit -m "Add update, soft-delete, restore, and cancel actions to CommentsController"
```

---

## Task 4: View changes — cancel button, hide Comment button, tombstone

**Files:**
- Modify: `app/views/comments/_frames.html.erb`
- Modify: `app/views/comments/new.html.erb`
- Modify: `app/views/comments/_comment.html.erb`

- [ ] **Step 1: Update `_frames.html.erb` — wrap in Stimulus toggle for Comment button visibility**

The Comment button must hide when the form opens and reappear when cancelled/submitted. Use a CSS-based approach: when the `new_object_comment` Turbo Frame has content, hide the button via CSS sibling selector; when empty, show it.

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

Then use CSS to hide the button when the form is present. Add to the relevant stylesheet (or inline with Tailwind):

```css
turbo-frame#new_object_comment:not(:empty) + turbo-frame#add_object_comment {
  display: none;
}
```

If CSS sibling selectors don't work reliably with Turbo Frames (they should, since Turbo Frames are regular DOM elements), fall back to a minimal Stimulus controller. The implementer should test the CSS approach first.

- [ ] **Step 2: Add Cancel button to new comment form**

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
        <%= link_to "Cancel",
              cancel_comments_path(object_gid: @resource.to_gid_param),
              data: { turbo_frame: "new_object_comment" },
              class: "secondary-button" %>
      </div>
```

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
git commit -m "Add cancel button, comment button toggle, tombstone, and edit/delete UI"
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

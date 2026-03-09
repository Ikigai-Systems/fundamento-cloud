# Batch Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the single-file `DocumentImport` system with a robust batch import
pipeline supporting large vaults (Obsidian), direct S3 uploads, per-file progress, wiki
link resolution, and a new `funcli import` command.

**Architecture:** A manifest-first API creates `ImportSession` + `ImportFile` records and
returns per-file presigned S3 upload URLs. After all files are uploaded, Good Job batches
run parallel conversion jobs, then a link-resolution pass resolves `[[wiki links]]`.
The web UI uses a Stimulus controller for drag-and-drop and direct S3 upload; the CLI
gains a new `import` command group with checksum-based resumability.

**Tech Stack:** Ruby on Rails 8.1, PostgreSQL, ActiveStorage (S3/MinIO), Good Job 4.4
(with batches), Hotwire (Turbo Streams + Stimulus), Node.js CLI (Commander.js)

---

## Task 1: Remove DocumentImport

**Goal:** Delete the old single-file import system cleanly before building the new one.

**Files:**
- Delete: `app/models/document_import.rb`
- Delete: `app/controllers/imports_controller.rb`
- Delete: `app/jobs/document_import_processor_job.rb`
- Delete: `app/policies/document_import_policy.rb`
- Delete: `spec/fixtures/document_imports.yml`
- Delete: `app/views/imports/` (entire directory)
- Modify: `app/models/document.rb`
- Modify: `app/models/organization_membership.rb`
- Modify: `config/routes.rb`
- Create: `db/migrate/<timestamp>_drop_document_imports.rb`

**Step 1: Create the drop migration**

```bash
bin/rails generate migration DropDocumentImports
```

Edit the generated file:

```ruby
class DropDocumentImports < ActiveRecord::Migration[8.1]
  def up
    drop_table :document_imports
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
```

**Step 2: Run migration**

```bash
bin/rails db:migrate
```

Expected: `== DropDocumentImports: migrated`

**Step 3: Remove the files**

```bash
command rm app/models/document_import.rb
command rm app/controllers/imports_controller.rb
command rm app/jobs/document_import_processor_job.rb
command rm app/policies/document_import_policy.rb
command rm spec/fixtures/document_imports.yml
command rm -r app/views/imports
```

**Step 4: Remove associations from Document model**

In `app/models/document.rb`, remove:

```ruby
has_one :import, class_name: "DocumentImport", dependent: :delete
```

**Step 5: Remove associations from OrganizationMembership**

In `app/models/organization_membership.rb`, remove:

```ruby
has_many :document_imports, dependent: :nullify
```

**Step 6: Remove routes**

In `config/routes.rb`, remove:

```ruby
resources :imports
```

**Step 7: Run tests to verify nothing is broken**

```bash
bin/rspec
```

Expected: All passing (some tests may have referenced document_imports fixture — fix any failures by removing those fixture references).

**Step 8: Commit**

```bash
git add -A
git commit -m "Remove DocumentImport system"
```

---

## Task 2: ImportSession migration

**Files:**
- Create: `db/migrate/<timestamp>_create_import_sessions.rb`

**Step 1: Generate migration**

```bash
bin/rails generate migration CreateImportSessions
```

**Step 2: Write migration**

```ruby
class CreateImportSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :import_sessions, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.belongs_to :organization, null: false, foreign_key: true, type: :string
      t.belongs_to :space, null: false, foreign_key: true, type: :string
      t.belongs_to :organization_membership, null: false, foreign_key: true, type: :string

      t.integer :status, null: false, default: 0
      t.string :source_format, null: false, default: "generic"

      t.integer :total_files, null: false, default: 0
      t.integer :uploaded_files, null: false, default: 0
      t.integer :processed_files, null: false, default: 0
      t.integer :failed_files, null: false, default: 0
      t.integer :skipped_files, null: false, default: 0

      t.jsonb :path_map, null: false, default: {}
      t.jsonb :settings, null: false, default: {}

      t.datetime :expires_at, null: false
      t.datetime :started_processing_at
      t.datetime :completed_processing_at

      t.timestamps
    end

    add_index :import_sessions, :status
    add_index :import_sessions, :expires_at
  end
end
```

**Step 3: Run migration**

```bash
bin/rails db:migrate
```

Expected: `== CreateImportSessions: migrated`

**Step 4: Commit**

```bash
git add db/migrate/ db/schema.rb
git commit -m "Add import_sessions table"
```

---

## Task 3: ImportSession model

**Files:**
- Create: `app/models/import_session.rb`
- Create: `spec/models/import_session_spec.rb`
- Create: `spec/fixtures/import_sessions.yml`
- Modify: `app/models/organization.rb`
- Modify: `app/models/space.rb`
- Modify: `app/models/organization_membership.rb`

**Step 1: Write the failing test**

Create `spec/models/import_session_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe ImportSession, type: :model do
  fixtures :organizations, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  describe "creation" do
    it "requires organization, space, and membership" do
      session = ImportSession.new
      expect(session.valid?).to be false
      expect(session.errors[:organization]).to include("must exist")
    end

    it "sets expires_at to 7 days from now by default" do
      session = ImportSession.create!(
        organization: org,
        space: space,
        organization_membership: membership
      )
      expect(session.expires_at).to be_within(1.minute).of(7.days.from_now)
    end

    it "defaults to pending status" do
      session = ImportSession.create!(
        organization: org,
        space: space,
        organization_membership: membership
      )
      expect(session).to be_pending
    end

    it "defaults source_format to generic" do
      session = ImportSession.create!(
        organization: org,
        space: space,
        organization_membership: membership
      )
      expect(session.source_format).to eq("generic")
    end
  end

  describe "#increment_counter!" do
    it "atomically increments the given counter" do
      session = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership
      )
      session.increment_counter!(:uploaded_files)
      expect(session.reload.uploaded_files).to eq(1)
    end
  end

  describe "#merge_path_map!" do
    it "atomically adds an entry to path_map" do
      session = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership
      )
      session.merge_path_map!("Notes/foo.md", "doc_abc")
      expect(session.reload.path_map).to eq({ "Notes/foo.md" => "doc_abc" })
    end

    it "does not overwrite existing entries" do
      session = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership
      )
      session.merge_path_map!("a.md", "doc_1")
      session.merge_path_map!("b.md", "doc_2")
      expect(session.reload.path_map.keys).to contain_exactly("a.md", "b.md")
    end
  end

  describe ".expired" do
    it "returns pending/uploading sessions past expires_at" do
      expired = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership,
        expires_at: 1.day.ago
      )
      active = ImportSession.create!(
        organization: org, space: space,
        organization_membership: membership,
        expires_at: 1.day.from_now
      )
      expect(ImportSession.expired).to include(expired)
      expect(ImportSession.expired).not_to include(active)
    end
  end
end
```

**Step 2: Run test to verify it fails**

```bash
bin/rspec spec/models/import_session_spec.rb
```

Expected: FAIL with `uninitialized constant ImportSession`

**Step 3: Create the model**

Create `app/models/import_session.rb`:

```ruby
class ImportSession < ApplicationRecord
  include NpiOrdering

  belongs_to :organization
  belongs_to :space
  belongs_to :organization_membership
  has_many :import_files, dependent: :destroy

  enum :status, {
    pending: 0,
    uploading: 1,
    processing: 2,
    completed: 3,
    failed: 4,
    partial: 5
  }

  enum :source_format, {
    generic: "generic",
    obsidian: "obsidian"
  }

  scope :recent, -> { order(created_at: :desc) }
  scope :expired, -> {
    where(status: [statuses[:pending], statuses[:uploading]])
      .where("expires_at < ?", Time.current)
  }

  before_create :set_expires_at

  def all_files_uploaded?
    import_files.where.not(status: ImportFile.statuses.slice(:uploaded, :completed, :skipped).values).none?
  end

  def increment_counter!(counter)
    self.class.where(id: id).update_all("#{counter} = #{counter} + 1")
    reload
  end

  def merge_path_map!(relative_path, object_id)
    self.class.where(id: id).update_all(
      ["path_map = path_map || ?::jsonb", { relative_path => object_id }.to_json]
    )
  end

  private

  def set_expires_at
    self.expires_at ||= 7.days.from_now
  end
end
```

**Step 4: Add associations to related models**

In `app/models/organization.rb`, add:
```ruby
has_many :import_sessions, dependent: :destroy
```

In `app/models/space.rb`, add:
```ruby
has_many :import_sessions, dependent: :destroy
```

In `app/models/organization_membership.rb`, add:
```ruby
has_many :import_sessions, dependent: :destroy
```

**Step 5: Create fixtures**

Create `spec/fixtures/import_sessions.yml`:

```yaml
is_session_uploading:
  id: "issession01"
  organization_id: "is"
  space_id: "is_default"
  organization_membership_id: "om_is_pawel"
  status: 1
  source_format: "obsidian"
  total_files: 10
  uploaded_files: 5
  processed_files: 0
  failed_files: 0
  skipped_files: 0
  path_map: {}
  settings: {}
  expires_at: <%= 7.days.from_now %>

hc_session_completed:
  id: "hcsession01"
  organization_id: "hc"
  space_id: "hc_default"
  organization_membership_id: "om_hc_pawel"
  status: 3
  source_format: "generic"
  total_files: 3
  uploaded_files: 3
  processed_files: 3
  failed_files: 0
  skipped_files: 0
  path_map: {}
  settings: {}
  expires_at: <%= 7.days.from_now %>
  completed_processing_at: <%= 1.hour.ago %>
```

**Step 6: Run tests**

```bash
bin/rspec spec/models/import_session_spec.rb
```

Expected: All passing

**Step 7: Commit**

```bash
git add app/models/import_session.rb spec/models/import_session_spec.rb \
        spec/fixtures/import_sessions.yml app/models/organization.rb \
        app/models/space.rb app/models/organization_membership.rb
git commit -m "Add ImportSession model"
```

---

## Task 4: ImportFile migration

**Files:**
- Create: `db/migrate/<timestamp>_create_import_files.rb`

**Step 1: Generate migration**

```bash
bin/rails generate migration CreateImportFiles
```

**Step 2: Write migration**

```ruby
class CreateImportFiles < ActiveRecord::Migration[8.1]
  def change
    create_table :import_files, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.belongs_to :import_session, null: false, foreign_key: true, type: :string
      t.belongs_to :document, null: true, foreign_key: true, type: :string

      t.string :relative_path, null: false
      t.integer :file_type, null: false, default: 0
      t.string :format, null: false, default: "other"
      t.integer :status, null: false, default: 0

      t.string :checksum
      t.bigint :file_size

      t.text :error_message
      t.datetime :uploaded_at
      t.datetime :processed_at

      t.timestamps
    end

    add_index :import_files, [:import_session_id, :status]
    add_index :import_files, [:import_session_id, :checksum]
    add_index :import_files, [:import_session_id, :relative_path], unique: true
  end
end
```

**Step 3: Run migration**

```bash
bin/rails db:migrate
```

Expected: `== CreateImportFiles: migrated`

**Step 4: Commit**

```bash
git add db/migrate/ db/schema.rb
git commit -m "Add import_files table"
```

---

## Task 5: ImportFile model

**Files:**
- Create: `app/models/import_file.rb`
- Create: `spec/models/import_file_spec.rb`
- Create: `spec/fixtures/import_files.yml`

**Step 1: Write failing test**

Create `spec/models/import_file_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe ImportFile, type: :model do
  fixtures :organizations, :spaces, :organization_memberships, :import_sessions

  let(:session) { import_sessions(:is_session_uploading) }

  describe "validations" do
    it "requires import_session and relative_path" do
      file = ImportFile.new
      expect(file.valid?).to be false
      expect(file.errors[:import_session]).to include("must exist")
      expect(file.errors[:relative_path]).to include("can't be blank")
    end
  end

  describe "enums" do
    it "has correct file_type values" do
      expect(ImportFile.file_types.keys).to contain_exactly("document", "attachment")
    end

    it "has correct status values" do
      expect(ImportFile.statuses.keys).to contain_exactly(
        "pending", "uploading", "uploaded", "processing", "completed", "failed", "skipped"
      )
    end
  end

  describe "scopes" do
    it ".for_session returns files for the given session" do
      file = ImportFile.create!(
        import_session: session,
        relative_path: "Notes/test.md",
        file_type: :document,
        format: "markdown"
      )
      expect(ImportFile.where(import_session: session)).to include(file)
    end
  end
end
```

**Step 2: Run test to verify it fails**

```bash
bin/rspec spec/models/import_file_spec.rb
```

Expected: FAIL with `uninitialized constant ImportFile`

**Step 3: Create the model**

Create `app/models/import_file.rb`:

```ruby
class ImportFile < ApplicationRecord
  include NpiOrdering

  belongs_to :import_session
  belongs_to :document, optional: true

  has_one_attached :file

  validates :relative_path, presence: true

  enum :file_type, { document: 0, attachment: 1 }

  enum :status, {
    pending: 0,
    uploading: 1,
    uploaded: 2,
    processing: 3,
    completed: 4,
    failed: 5,
    skipped: 6
  }

  SUPPORTED_DOCUMENT_FORMATS = %w[markdown docx odt doc].freeze
  SUPPORTED_ATTACHMENT_FORMATS = %w[image pdf video other].freeze

  scope :needing_upload, -> {
    where.not(status: [statuses[:uploaded], statuses[:completed], statuses[:skipped]])
  }

  def directory_path
    File.dirname(relative_path)
  end

  def filename
    File.basename(relative_path)
  end
end
```

**Step 4: Create fixtures**

Create `spec/fixtures/import_files.yml`:

```yaml
is_file_pending:
  id: "isfile001"
  import_session_id: "issession01"
  relative_path: "Notes/hello.md"
  file_type: 0
  format: "markdown"
  status: 0
  checksum: "abc123"
  file_size: 1024

is_file_uploaded:
  id: "isfile002"
  import_session_id: "issession01"
  relative_path: "assets/image.png"
  file_type: 1
  format: "image"
  status: 2
  checksum: "def456"
  file_size: 204800
  uploaded_at: <%= 10.minutes.ago %>
```

**Step 5: Run tests**

```bash
bin/rspec spec/models/import_file_spec.rb
```

Expected: All passing

**Step 6: Commit**

```bash
git add app/models/import_file.rb spec/models/import_file_spec.rb \
        spec/fixtures/import_files.yml
git commit -m "Add ImportFile model"
```

---

## Task 6: Policies and routes

**Files:**
- Create: `app/policies/import_session_policy.rb`
- Modify: `config/routes.rb`

**Step 1: Create policy**

Create `app/policies/import_session_policy.rb`:

```ruby
class ImportSessionPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(organization: user_context.current_organization)
    end
  end

  def index?
    user_context.organization_membership.present?
  end

  def show?
    record.organization == user_context.current_organization
  end

  def create?
    user_context.organization_membership.present?
  end

  def update?
    owns_or_manages?
  end

  def destroy?
    owns_or_manages?
  end

  private

  def owns_or_manages?
    record.organization_membership == user_context.organization_membership ||
      user_context.organization_membership.manager?
  end
end
```

**Step 2: Add API routes**

In `config/routes.rb`, inside the `namespace :v1` block, add:

```ruby
resources :import_sessions, only: [:create, :show, :destroy] do
  member do
    post :manifest
    post :process, action: :trigger_processing
    post :retry, action: :retry_failed
  end
  resources :import_files, only: [:update]
end
```

Also inside `defaults export: true`, replace `resources :imports` with:

```ruby
resources :import_sessions, only: [:index, :show]
```

**Step 3: Run tests**

```bash
bin/rspec
```

Expected: All passing (no controller yet, just routes registered)

**Step 4: Commit**

```bash
git add app/policies/import_session_policy.rb config/routes.rb
git commit -m "Add ImportSession policy and routes"
```

---

## Task 7: ImportSessionsController — CRUD

**Files:**
- Create: `app/controllers/api/v1/import_sessions_controller.rb`
- Create: `spec/requests/api/v1/import_sessions_controller_spec.rb`

**Step 1: Write failing tests**

Create `spec/requests/api/v1/import_sessions_controller_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Api::V1::ImportSessions", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :import_sessions

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:is_default_space) { spaces(:is_default) }
  let(:pawel_ikigai_systems) { organization_memberships(:om_is_pawel) }
  let(:completed_session) { import_sessions(:hc_session_completed) }

  let!(:api_token) do
    ApiToken.create!(
      organization: ikigai_systems,
      organization_membership: pawel_ikigai_systems,
      title: "Test token"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{api_token.encrypted_token}" } }

  describe "POST /api/v1/import_sessions" do
    it "creates a session and returns id and expires_at" do
      post api_v1_import_sessions_path,
        params: { space_id: is_default_space.id, source_format: "obsidian" },
        headers: auth_headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json).to have_key("id")
      expect(json).to have_key("expires_at")
      expect(json["status"]).to eq("pending")
    end

    it "returns 403 without a valid token" do
      post api_v1_import_sessions_path,
        params: { space_id: is_default_space.id }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/import_sessions/:id" do
    it "returns session status and counters" do
      session = ImportSession.create!(
        organization: ikigai_systems,
        space: is_default_space,
        organization_membership: pawel_ikigai_systems
      )

      get api_v1_import_session_path(session), headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["id"]).to eq(session.id)
      expect(json).to have_key("total_files")
      expect(json).to have_key("uploaded_files")
      expect(json).to have_key("processed_files")
    end
  end

  describe "DELETE /api/v1/import_sessions/:id" do
    it "destroys the session" do
      session = ImportSession.create!(
        organization: ikigai_systems,
        space: is_default_space,
        organization_membership: pawel_ikigai_systems
      )

      delete api_v1_import_session_path(session), headers: auth_headers

      expect(response).to have_http_status(:no_content)
      expect(ImportSession.find_by(id: session.id)).to be_nil
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/requests/api/v1/import_sessions_controller_spec.rb
```

Expected: FAIL with routing errors or 404s

**Step 3: Implement the controller**

Create `app/controllers/api/v1/import_sessions_controller.rb`:

```ruby
module Api
  module V1
    class ImportSessionsController < Api::ApiController
      def create
        space = current_organization.spaces.find(params[:space_id])
        session = current_organization.import_sessions.build(
          space: space,
          organization_membership: current_organization_membership,
          source_format: params[:source_format] || "generic",
          settings: params[:settings] || {}
        )

        authorize session

        session.save!

        render json: session_json(session), status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Space not found" }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def show
        session = load_session
        authorize session

        render json: session_json(session).merge(
          files: session.import_files.order(:relative_path).map { |f| file_json(f) }
        )
      end

      def destroy
        session = load_session
        authorize session

        session.destroy!
        head :no_content
      end

      private

      def find_session
        current_organization.import_sessions.find(params[:id])
      end

      def session_json(session)
        {
          id: session.id,
          status: session.status,
          source_format: session.source_format,
          total_files: session.total_files,
          uploaded_files: session.uploaded_files,
          processed_files: session.processed_files,
          failed_files: session.failed_files,
          skipped_files: session.skipped_files,
          expires_at: session.expires_at,
          started_processing_at: session.started_processing_at,
          completed_processing_at: session.completed_processing_at,
          created_at: session.created_at
        }
      end

      def file_json(file)
        {
          id: file.id,
          relative_path: file.relative_path,
          file_type: file.file_type,
          format: file.format,
          status: file.status,
          checksum: file.checksum,
          file_size: file.file_size,
          error_message: file.error_message,
          uploaded_at: file.uploaded_at,
          processed_at: file.processed_at,
          document_id: file.document_id
        }
      end
    end
  end
end
```

**Step 4: Run tests**

```bash
bin/rspec spec/requests/api/v1/import_sessions_controller_spec.rb
```

Expected: All passing

**Step 5: Commit**

```bash
git add app/controllers/api/v1/import_sessions_controller.rb \
        spec/requests/api/v1/import_sessions_controller_spec.rb
git commit -m "Add ImportSessionsController CRUD endpoints"
```

---

## Task 8: Manifest endpoint

**Files:**
- Modify: `app/controllers/api/v1/import_sessions_controller.rb`
- Create: `spec/requests/api/v1/import_sessions_manifest_spec.rb`

**Step 1: Write failing test**

Create `spec/requests/api/v1/import_sessions_manifest_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Api::V1::ImportSessions#manifest", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  let!(:api_token) do
    ApiToken.create!(
      organization: org,
      organization_membership: membership,
      title: "Test token"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{api_token.encrypted_token}" } }

  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership
    )
  end

  let(:manifest_files) do
    [
      { relative_path: "Notes/hello.md", checksum: "abc123", file_size: 1024,
        format: "markdown", file_type: "document" },
      { relative_path: "assets/image.png", checksum: "def456", file_size: 204800,
        format: "image", file_type: "attachment" }
    ]
  end

  describe "POST /api/v1/import_sessions/:id/manifest" do
    it "creates ImportFile records and returns upload URLs for all files" do
      post manifest_api_v1_import_session_path(session),
        params: { files: manifest_files },
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
      expect(json.first).to have_key("id")
      expect(json.first).to have_key("direct_upload_url")
      expect(session.import_files.count).to eq(2)
      expect(session.reload.total_files).to eq(2)
    end

    it "skips already-uploaded files with matching checksum" do
      # Pre-create an uploaded file
      existing = ImportFile.create!(
        import_session: session,
        relative_path: "Notes/hello.md",
        checksum: "abc123",
        file_size: 1024,
        format: "markdown",
        file_type: :document,
        status: :uploaded
      )

      post manifest_api_v1_import_session_path(session),
        params: { files: manifest_files },
        headers: auth_headers

      json = JSON.parse(response.body)
      already_uploaded = json.find { |f| f["relative_path"] == "Notes/hello.md" }
      expect(already_uploaded["status"]).to eq("uploaded")
      expect(already_uploaded["direct_upload_url"]).to be_nil
    end

    it "re-issues upload URL when checksum changed" do
      existing = ImportFile.create!(
        import_session: session,
        relative_path: "Notes/hello.md",
        checksum: "old_checksum",
        file_size: 1024,
        format: "markdown",
        file_type: :document,
        status: :uploaded
      )

      post manifest_api_v1_import_session_path(session),
        params: { files: manifest_files },
        headers: auth_headers

      json = JSON.parse(response.body)
      changed = json.find { |f| f["relative_path"] == "Notes/hello.md" }
      expect(changed["direct_upload_url"]).to be_present
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/requests/api/v1/import_sessions_manifest_spec.rb
```

Expected: FAIL with routing error

**Step 3: Implement manifest action**

Add to `app/controllers/api/v1/import_sessions_controller.rb`, before the `private` keyword:

```ruby

def manifest
  session = load_session
  authorize session, :update?

  file_entries = Array(params[:files])
  results = file_entries.map { |entry| process_manifest_entry(session, entry) }

  session.update!(
    total_files: session.import_files.count,
    status: :uploading
  )

  render json: results
end
```

And add these private methods:

```ruby
def process_manifest_entry(session, entry)
  import_file = session.import_files.find_or_initialize_by(
    relative_path: entry[:relative_path]
  )

  if import_file.persisted? &&
      import_file.uploaded? &&
      import_file.checksum == entry[:checksum]
    return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil)
  end

  import_file.assign_attributes(
    checksum: entry[:checksum],
    file_size: entry[:file_size].to_i,
    format: entry[:format],
    file_type: entry[:file_type],
    status: :pending
  )
  import_file.save!

  blob = ActiveStorage::Blob.create_before_direct_upload!(
    filename: File.basename(entry[:relative_path].to_s),
    byte_size: entry[:file_size].to_i,
    checksum: entry[:checksum],
    content_type: content_type_for_format(entry[:format])
  )

  import_file.file.attach(blob)

  file_json(import_file).merge(
    direct_upload_url: blob.service_url_for_direct_upload,
    signed_blob_id: blob.signed_id
  )
end

def content_type_for_format(format)
  case format.to_s
  when "markdown" then "text/markdown"
  when "docx" then "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  when "odt" then "application/vnd.oasis.opendocument.text"
  when "image" then "image/*"
  when "pdf" then "application/pdf"
  when "video" then "video/*"
  else "application/octet-stream"
  end
end
```

**Step 4: Run tests**

```bash
bin/rspec spec/requests/api/v1/import_sessions_manifest_spec.rb
```

Expected: All passing

**Step 5: Commit**

```bash
git add app/controllers/api/v1/import_sessions_controller.rb \
        spec/requests/api/v1/import_sessions_manifest_spec.rb
git commit -m "Add manifest endpoint to ImportSessionsController"
```

---

## Task 9: File confirmation and process/retry endpoints

**Files:**
- Create: `app/controllers/api/v1/import_files_controller.rb`
- Modify: `app/controllers/api/v1/import_sessions_controller.rb`
- Create: `spec/requests/api/v1/import_files_controller_spec.rb`

**Step 1: Write failing test**

Create `spec/requests/api/v1/import_files_controller_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Api::V1::ImportFiles", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :import_sessions, :import_files

  let(:org) { organizations(:is) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) { import_sessions(:is_session_uploading) }
  let(:pending_file) { import_files(:is_file_pending) }

  let!(:api_token) do
    ApiToken.create!(organization: org, organization_membership: membership, title: "Test token")
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{api_token.encrypted_token}" } }

  describe "PATCH /api/v1/import_sessions/:session_id/import_files/:id" do
    it "marks file as uploaded and sets uploaded_at" do
      patch api_v1_import_session_import_file_path(session, pending_file),
        params: { status: "uploaded" },
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      pending_file.reload
      expect(pending_file).to be_uploaded
      expect(pending_file.uploaded_at).to be_present
    end

    it "increments the session uploaded_files counter" do
      expect {
        patch api_v1_import_session_import_file_path(session, pending_file),
          params: { status: "uploaded" },
          headers: auth_headers
      }.to change { session.reload.uploaded_files }.by(1)
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/requests/api/v1/import_files_controller_spec.rb
```

Expected: FAIL

**Step 3: Create ImportFilesController**

Create `app/controllers/api/v1/import_files_controller.rb`:

```ruby
module Api
  module V1
    class ImportFilesController < Api::ApiController
      def update
        session = current_organization.import_sessions.find(params[:import_session_id])
        import_file = session.import_files.find(params[:id])

        authorize session, :update?

        if params[:status] == "uploaded"
          import_file.update!(status: :uploaded, uploaded_at: Time.current)
          session.increment_counter!(:uploaded_files)
        end

        render json: {
          id: import_file.id,
          status: import_file.status,
          uploaded_at: import_file.uploaded_at
        }
      end
    end
  end
end
```

**Step 4: Add process and retry actions to ImportSessionsController**

Add before `private` in the sessions controller:

```ruby

def trigger_processing
  session = load_session
  authorize session, :update?

  still_pending = session.import_files.where(status: [:pending, :uploading]).count
  if still_pending > 0
    return render json: {
      error: "#{still_pending} files not yet uploaded"
    }, status: :unprocessable_entity
  end

  if session.processing? || session.completed?
    return render json: { error: "Session is already #{session.status}" },
      status: :unprocessable_entity
  end

  session.update!(status: :processing, started_processing_at: Time.current)
  ImportSessionOrchestratorJob.perform_later(session)

  render json: session_json(session)
end

def retry_failed
  session = load_session
  authorize session, :update?

  failed_files = session.import_files.where(status: :failed)
  failed_files.update_all(status: :pending, error_message: nil)

  session.update!(status: :processing)
  ImportSessionOrchestratorJob.perform_later(session)

  render json: session_json(session)
end
```

**Step 5: Run tests**

```bash
bin/rspec spec/requests/api/v1/import_files_controller_spec.rb
bin/rspec spec/requests/api/v1/import_sessions_controller_spec.rb
```

Expected: All passing

**Step 6: Commit**

```bash
git add app/controllers/api/v1/import_files_controller.rb \
        app/controllers/api/v1/import_sessions_controller.rb \
        spec/requests/api/v1/import_files_controller_spec.rb
git commit -m "Add file confirmation and process/retry endpoints"
```

---

## Task 10: ImportSessionOrchestratorJob

**Files:**
- Create: `app/jobs/import_session_orchestrator_job.rb`
- Create: `spec/jobs/import_session_orchestrator_job_spec.rb`

**Step 1: Write failing test**

Create `spec/jobs/import_session_orchestrator_job_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe ImportSessionOrchestratorJob, type: :job do
  fixtures :organizations, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :processing
    )
  end

  def add_file(relative_path:, file_type:, format: "markdown", status: :uploaded)
    ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: file_type,
      format: format,
      status: status,
      checksum: SecureRandom.hex,
      file_size: 1024
    )
  end

  describe "#perform" do
    it "creates directory documents for intermediate paths before enqueuing file jobs" do
      add_file(relative_path: "Notes/Projects/foo.md", file_type: :document)

      expect(ImportDocumentJob).to receive(:perform_later).once
      expect(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end

    it "enqueues ImportDocumentJob for each document file" do
      add_file(relative_path: "doc1.md", file_type: :document)
      add_file(relative_path: "doc2.md", file_type: :document)

      expect(ImportDocumentJob).to receive(:perform_later).twice
      expect(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end

    it "enqueues ImportAttachmentJob for each attachment file" do
      add_file(relative_path: "assets/img.png", file_type: :attachment, format: "image")

      expect(ImportAttachmentJob).to receive(:perform_later).once
      expect(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end

    it "skips non-uploaded files" do
      add_file(relative_path: "failed.md", file_type: :document, status: :failed)

      expect(ImportDocumentJob).not_to receive(:perform_later)
      expect(GoodJob::Batch).to receive(:enqueue).and_yield

      described_class.perform_now(session)
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/jobs/import_session_orchestrator_job_spec.rb
```

Expected: FAIL

**Step 3: Implement the job**

Create `app/jobs/import_session_orchestrator_job.rb`:

```ruby
class ImportSessionOrchestratorJob < ApplicationJob
  queue_as :imports

  def perform(session)
    return unless session.processing?

    # Build parent directory documents depth-first before processing files
    create_directory_documents(session)

    # Enqueue all file processing jobs in a Good Job batch
    GoodJob::Batch.enqueue(
      on_finish: ImportLinkResolutionJob,
      properties: { import_session_id: session.id }
    ) do
      session.import_files.where(status: :uploaded).find_each do |import_file|
        if import_file.document?
          ImportDocumentJob.perform_later(import_file)
        else
          ImportAttachmentJob.perform_later(import_file)
        end
      end
    end
  end

  private

  def create_directory_documents(session)
    # Collect all unique directory paths, sorted by depth (shallowest first)
    dir_paths = session.import_files
      .pluck(:relative_path)
      .flat_map { |path| ancestor_paths(path) }
      .uniq
      .sort_by { |path| path.count("/") }

    dir_paths.each do |dir_path|
      next if dir_path == "."

      parent_path = File.dirname(dir_path)
      parent_id = parent_path == "." ? nil : session.path_map[parent_path]

      dir_name = File.basename(dir_path)
      space = session.space

      document = space.documents.create!(
        organization: session.organization,
        title: dir_name
      )

      hierarchy_node = space.create_hierarchy_node(document.id)
      if parent_id.present?
        space.add_item_to_hierarchy!(space.hierarchy, parent_id, hierarchy_node)
      else
        space.hierarchy.append(hierarchy_node)
      end
      space.save!

      session.merge_path_map!(dir_path, document.id)
    end
  end

  def ancestor_paths(file_path)
    parts = File.dirname(file_path).split("/")
    return [] if parts == ["."]

    parts.each_index.map { |i| parts[0..i].join("/") }
  end
end
```

**Step 4: Run tests**

```bash
bin/rspec spec/jobs/import_session_orchestrator_job_spec.rb
```

Expected: All passing

**Step 5: Commit**

```bash
git add app/jobs/import_session_orchestrator_job.rb \
        spec/jobs/import_session_orchestrator_job_spec.rb
git commit -m "Add ImportSessionOrchestratorJob"
```

---

## Task 11: ImportDocumentJob

**Files:**
- Create: `app/jobs/import_document_job.rb`
- Create: `spec/jobs/import_document_job_spec.rb`

**Step 1: Write failing test**

Create `spec/jobs/import_document_job_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe ImportDocumentJob, type: :job do
  fixtures :organizations, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :processing
    )
  end

  def build_import_file(relative_path:, format: "markdown", content: "# Hello\n\nWorld")
    import_file = ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: :document,
      format: format,
      status: :uploaded,
      checksum: Digest::SHA256.hexdigest(content),
      file_size: content.bytesize
    )
    import_file.file.attach(
      io: StringIO.new(content),
      filename: File.basename(relative_path),
      content_type: "text/markdown"
    )
    import_file
  end

  describe "#perform" do
    it "creates a Document from a markdown file" do
      import_file = build_import_file(relative_path: "Notes/hello.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      expect {
        described_class.perform_now(import_file)
      }.to change(Document, :count).by(1)

      import_file.reload
      expect(import_file).to be_completed
      expect(import_file.document).to be_present
      expect(import_file.processed_at).to be_present
    end

    it "sets the document title from filename when no frontmatter title" do
      import_file = build_import_file(relative_path: "Notes/my-note.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      expect(import_file.document.title).to eq("my-note")
    end

    it "uses frontmatter title when present" do
      content = "---\ntitle: My Custom Title\n---\n\nBody text"
      import_file = build_import_file(relative_path: "Notes/file.md", content: content)
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      expect(import_file.document.title).to eq("My Custom Title")
    end

    it "marks as failed and records error on conversion failure" do
      import_file = build_import_file(relative_path: "Notes/bad.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
        .and_raise(BlocknoteConverterService::ConversionError, "boom")

      described_class.perform_now(import_file)

      import_file.reload
      expect(import_file).to be_failed
      expect(import_file.error_message).to include("boom")
    end

    it "increments session processed_files on success" do
      import_file = build_import_file(relative_path: "note.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      expect {
        described_class.perform_now(import_file)
      }.to change { session.reload.processed_files }.by(1)
    end

    it "increments session failed_files on failure" do
      import_file = build_import_file(relative_path: "bad.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks)
        .and_raise(BlocknoteConverterService::ConversionError)

      expect {
        described_class.perform_now(import_file)
      }.to change { session.reload.failed_files }.by(1)
    end

    it "places document under correct parent when path_map has parent directory" do
      parent_doc = Document.create!(organization: org, space: space, title: "Notes")
      space.hierarchy.append(space.create_hierarchy_node(parent_doc.id))
      space.save!
      session.merge_path_map!("Notes", parent_doc.id)

      import_file = build_import_file(relative_path: "Notes/child.md")
      allow(BlocknoteConverterService).to receive(:markdown_to_blocks).and_return([])
      allow(BlocknoteConverterService).to receive(:blocks_to_yjs).and_return("")

      described_class.perform_now(import_file)

      child_doc = import_file.reload.document
      expect(child_doc.parent&.id).to eq(parent_doc.id)
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/jobs/import_document_job_spec.rb
```

Expected: FAIL

**Step 3: Implement the job**

Create `app/jobs/import_document_job.rb`:

```ruby
class ImportDocumentJob < ApplicationJob
  queue_as :imports

  def perform(import_file)
    return unless import_file.uploaded?

    import_file.update!(status: :processing)
    session = import_file.import_session

    markdown = fetch_markdown(import_file)
    markdown, frontmatter = extract_frontmatter(markdown)
    title = frontmatter&.dig("title") || File.basename(import_file.relative_path, ".*")

    parent_id = parent_document_id(import_file, session)

    blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
    sync = BlocknoteConverterService.blocks_to_yjs(blocks)

    document = nil
    ActiveRecord::Base.transaction do
      document = session.space.documents.create!(
        organization: session.organization,
        title: title
      )

      hierarchy_node = session.space.create_hierarchy_node(document.id)
      if parent_id.present?
        session.space.add_item_to_hierarchy!(session.space.hierarchy, parent_id, hierarchy_node)
      else
        session.space.hierarchy.append(hierarchy_node)
      end
      session.space.save!

      document.versions.create!(
        content_blocks: blocks,
        created_by: session.organization_membership.user
      )
      document.update!(sync: sync)

      if frontmatter&.dig("tags").is_a?(Array)
        TagsService.new(object: document, organization: session.organization)
          .update_tags(frontmatter["tags"])
      end
    end

    import_file.update!(
      status: :completed,
      document: document,
      processed_at: Time.current,
      error_message: nil
    )

    session.merge_path_map!(import_file.relative_path, document.id)
    session.increment_counter!(:processed_files)

  rescue StandardError => e
    import_file.update!(
      status: :failed,
      error_message: e.message,
      processed_at: Time.current
    )
    session.increment_counter!(:failed_files)
  end

  private

  def fetch_markdown(import_file)
    import_file.file.open do |temp_file|
      case import_file.format
      when "markdown"
        temp_file.read
      when "docx", "odt", "doc"
        result = PandocConverterService.file_to_markdown(temp_file.path, import_file.format)
        result
      else
        raise "Unsupported document format: #{import_file.format}"
      end
    end
  end

  def extract_frontmatter(markdown)
    frontmatter_data = nil
    if markdown.start_with?("---\n")
      parts = markdown.split(/^---\s*$/m, 3)
      if parts.length >= 3
        frontmatter_data = YAML.safe_load(parts[1])
        markdown = parts[2].strip
      end
    end
    [markdown, frontmatter_data]
  end

  def parent_document_id(import_file, session)
    dir_path = import_file.directory_path
    return nil if dir_path == "."

    session.reload.path_map[dir_path]
  end
end
```

**Step 4: Run tests**

```bash
bin/rspec spec/jobs/import_document_job_spec.rb
```

Expected: All passing

**Step 5: Commit**

```bash
git add app/jobs/import_document_job.rb spec/jobs/import_document_job_spec.rb
git commit -m "Add ImportDocumentJob"
```

---

## Task 12: ImportAttachmentJob

**Files:**
- Create: `app/jobs/import_attachment_job.rb`
- Create: `spec/jobs/import_attachment_job_spec.rb`

**Step 1: Write failing test**

Create `spec/jobs/import_attachment_job_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe ImportAttachmentJob, type: :job do
  fixtures :organizations, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :processing
    )
  end

  def build_attachment_file(relative_path:, format: "image")
    import_file = ImportFile.create!(
      import_session: session,
      relative_path: relative_path,
      file_type: :attachment,
      format: format,
      status: :uploaded,
      checksum: SecureRandom.hex,
      file_size: 1024
    )
    import_file.file.attach(
      io: StringIO.new("fake image data"),
      filename: File.basename(relative_path),
      content_type: "image/png"
    )
    import_file
  end

  describe "#perform" do
    it "creates an Attachment record pointing to the blob" do
      import_file = build_attachment_file(relative_path: "assets/photo.png")

      expect {
        described_class.perform_now(import_file)
      }.to change(Attachment, :count).by(1)

      import_file.reload
      expect(import_file).to be_completed
    end

    it "writes relative_path → attachment_id to session path_map" do
      import_file = build_attachment_file(relative_path: "assets/photo.png")
      described_class.perform_now(import_file)

      attachment = Attachment.last
      expect(session.reload.path_map["assets/photo.png"]).to eq("attachment:#{attachment.id}")
    end

    it "increments session processed_files counter" do
      import_file = build_attachment_file(relative_path: "assets/photo.png")

      expect {
        described_class.perform_now(import_file)
      }.to change { session.reload.processed_files }.by(1)
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/jobs/import_attachment_job_spec.rb
```

Expected: FAIL

**Step 3: Implement the job**

Create `app/jobs/import_attachment_job.rb`:

```ruby
class ImportAttachmentJob < ApplicationJob
  queue_as :imports

  def perform(import_file)
    return unless import_file.uploaded?

    import_file.update!(status: :processing)
    session = import_file.import_session

    attachment = Attachment.create!(
      organization: session.organization,
      parent: session.space,
      filename: import_file.filename,
      mime_type: import_file.file.blob.content_type
    )
    attachment.file.attach(import_file.file.blob)

    import_file.update!(
      status: :completed,
      processed_at: Time.current
    )

    # Store as "attachment:<id>" so BlockNote nodes can reference via createFileUrlResolver
    session.merge_path_map!(import_file.relative_path, "attachment:#{attachment.id}")
    session.increment_counter!(:processed_files)

  rescue StandardError => e
    import_file.update!(
      status: :failed,
      error_message: e.message,
      processed_at: Time.current
    )
    session.increment_counter!(:failed_files)
  end
end
```

**Step 4: Run tests**

```bash
bin/rspec spec/jobs/import_attachment_job_spec.rb
```

Expected: All passing

**Step 5: Commit**

```bash
git add app/jobs/import_attachment_job.rb spec/jobs/import_attachment_job_spec.rb
git commit -m "Add ImportAttachmentJob"
```

---

## Task 13: ImportLinkResolutionJob and ImportSessionCompletionJob

**Files:**
- Create: `app/jobs/import_link_resolution_job.rb`
- Create: `app/jobs/import_session_completion_job.rb`
- Create: `spec/jobs/import_link_resolution_job_spec.rb`

**Step 1: Write failing test**

Create `spec/jobs/import_link_resolution_job_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe ImportLinkResolutionJob, type: :job do
  fixtures :organizations, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }
  let(:session) do
    ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :processing,
      source_format: "obsidian"
    )
  end

  def make_document(title:, path:)
    doc = Document.create!(organization: org, space: space, title: title)
    session.merge_path_map!(path, doc.id)
    doc
  end

  describe "#wiki_link_targets" do
    subject { described_class.new }

    it "resolves [[filename]] by basename" do
      path_map = { "Notes/foo.md" => "doc1", "Notes/bar.md" => "doc2" }
      expect(subject.send(:resolve_wiki_link, "foo", path_map)).to eq("doc1")
    end

    it "resolves [[path/to/file]] by full path" do
      path_map = { "Notes/foo.md" => "doc1" }
      expect(subject.send(:resolve_wiki_link, "Notes/foo", path_map)).to eq("doc1")
    end

    it "returns nil for unresolvable links" do
      path_map = {}
      expect(subject.send(:resolve_wiki_link, "missing", path_map)).to be_nil
    end
  end

  describe "#process_wiki_links_in_markdown" do
    subject { described_class.new }

    it "replaces [[link]] with fundamento link syntax" do
      path_map = { "Notes/foo.md" => "doc_abc" }
      markdown = "See [[foo]] for details"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("doc_abc")
      expect(result).not_to include("[[foo]]")
    end

    it "replaces unresolvable [[link]] with broken-link marker" do
      path_map = {}
      markdown = "See [[missing]] here"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("[[missing]]")
      expect(result).to include("broken_link")
    end

    it "replaces ![[image.png]] with attachment reference" do
      path_map = { "assets/image.png" => "attachment:42" }
      markdown = "Here ![[image.png]] is shown"
      result = subject.send(:process_wiki_links_in_markdown, markdown, path_map)
      expect(result).to include("attachment:42")
    end
  end
end
```

**Step 2: Run test to confirm failure**

```bash
bin/rspec spec/jobs/import_link_resolution_job_spec.rb
```

Expected: FAIL

**Step 3: Implement ImportLinkResolutionJob**

Create `app/jobs/import_link_resolution_job.rb`:

```ruby
class ImportLinkResolutionJob < ApplicationJob
  queue_as :imports

  # Called by Good Job batch on_finish callback
  # batch and options are passed by Good Job
  def perform(batch = nil, options = {})
    session_id = options.is_a?(Hash) ? options["import_session_id"] : options
    session_id ||= batch&.properties&.dig("import_session_id")

    session = ImportSession.find(session_id)
    path_map = session.reload.path_map

    # Build basename index for Obsidian-style [[filename]] resolution
    basename_map = build_basename_map(path_map)

    session.import_files.where(status: :completed, file_type: :document).find_each do |import_file|
      resolve_links_for_document(import_file, path_map, basename_map)
    end

    ImportSessionCompletionJob.perform_later(session)
  end

  private

  def build_basename_map(path_map)
    basename_map = {}
    path_map.each do |path, id|
      next unless path.end_with?(".md", ".docx", ".odt", ".doc")

      basename = File.basename(path, ".*")
      # Only add if basename is unique (first occurrence wins — shallowest path)
      basename_map[basename] ||= id
    end
    basename_map
  end

  def resolve_links_for_document(import_file, path_map, basename_map)
    document = import_file.document
    return unless document

    latest_version = document.versions.last
    return unless latest_version

    blocks = latest_version.content_blocks
    blocks_json = blocks.to_json

    return unless blocks_json.include?("[[") || blocks_json.include?("![[")

    resolved_markdown = nil
    import_file.file.open do |f|
      # Re-fetch original markdown to process wiki links
      # (blocks don't preserve raw [[...]] syntax — we need the original)
      resolved_markdown = process_wiki_links_in_markdown(f.read, path_map.merge(basename_map))
    end

    return unless resolved_markdown

    new_blocks = BlocknoteConverterService.markdown_to_blocks(resolved_markdown)
    new_sync = BlocknoteConverterService.blocks_to_yjs(new_blocks)

    document.versions.create!(
      content_blocks: new_blocks,
      created_by: import_file.import_session.organization_membership.user
    )
    document.update!(sync: new_sync)
  rescue StandardError => e
    Rails.logger.error "ImportLinkResolutionJob: failed for #{import_file.relative_path}: #{e.message}"
    # Non-fatal — continue with other documents
  end

  def process_wiki_links_in_markdown(markdown, combined_map)
    # Replace ![[attachment]] with image/file markdown using attachment: URI
    markdown = markdown.gsub(/!\[\[([^\]]+)\]\]/) do |match|
      target = $1.strip
      attachment_uri = resolve_attachment_link(target, combined_map)
      if attachment_uri
        "![#{target}](#{attachment_uri})"
      else
        match # leave as-is, will be a broken link
      end
    end

    # Replace [[wiki links]] with markdown links or broken-link markers
    markdown.gsub(/\[\[([^\]]+)\]\]/) do |match|
      raw = $1.strip
      # Handle [[target|alias]] syntax
      target, alias_text = raw.split("|", 2).map(&:strip)
      # Handle [[target#heading]] syntax
      target_base, heading = target.split("#", 2)

      doc_id = resolve_wiki_link(target_base, combined_map)

      if doc_id
        display = alias_text || target_base
        anchor = heading ? "##{heading}" : ""
        "[#{display}](/d/#{doc_id}#{anchor})"
      else
        # Broken link marker — preserve original text
        display = alias_text || target
        "~~[[#{display}]]~~{.broken_link data-original=\"#{match}\"}"
      end
    end
  end

  def resolve_wiki_link(target, combined_map)
    # Try exact path match first (with .md extension)
    combined_map["#{target}.md"] ||
      combined_map[target] ||
      combined_map[target.downcase] # case-insensitive fallback
  end

  def resolve_attachment_link(target, combined_map)
    combined_map[target] ||
      combined_map.find { |path, _| File.basename(path) == target }&.last
  end
end
```

**Step 4: Implement ImportSessionCompletionJob**

Create `app/jobs/import_session_completion_job.rb`:

```ruby
class ImportSessionCompletionJob < ApplicationJob
  queue_as :imports

  def perform(session)
    final_status = session.failed_files > 0 ? :partial : :completed
    session.update!(
      status: final_status,
      completed_processing_at: Time.current
    )

    broadcast_completion(session)
  end

  private

  def broadcast_completion(session)
    Turbo::StreamsChannel.broadcast_replace_to(
      ["import_session", session],
      target: "import_session_#{session.id}_status",
      partial: "imports/session_status",
      locals: { session: session }
    )
  end
end
```

**Step 5: Run tests**

```bash
bin/rspec spec/jobs/import_link_resolution_job_spec.rb
```

Expected: All passing

**Step 6: Commit**

```bash
git add app/jobs/import_link_resolution_job.rb \
        app/jobs/import_session_completion_job.rb \
        spec/jobs/import_link_resolution_job_spec.rb
git commit -m "Add ImportLinkResolutionJob and ImportSessionCompletionJob"
```

---

## Task 14: Cleanup cron job

**Files:**
- Create: `app/jobs/import_session_cleanup_job.rb`
- Modify: `config/recurring.yml` (or equivalent Good Job cron config)

**Step 1: Create cleanup job**

Create `app/jobs/import_session_cleanup_job.rb`:

```ruby
class ImportSessionCleanupJob < ApplicationJob
  queue_as :maintenance

  def perform
    expired_sessions = ImportSession.expired

    expired_sessions.find_each do |session|
      # Active Storage blobs are cleaned up via dependent: :destroy on ImportFile
      # which triggers has_one_attached cleanup
      session.destroy!
    end

    Rails.logger.info "ImportSessionCleanupJob: cleaned up #{expired_sessions.count} expired sessions"
  end
end
```

**Step 2: Configure Good Job recurring task**

Check if `config/recurring.yml` exists. If not, create it. Add the cleanup task:

```yaml
import_session_cleanup:
  class: ImportSessionCleanupJob
  cron: "0 3 * * *"   # Daily at 3am
  description: "Clean up expired import sessions and their uploaded files"
```

Then in `config/application.rb` (or the appropriate environment file), ensure Good Job loads recurring tasks:

```ruby
config.good_job.cron = Rails.application.config_for(:recurring)
```

**Step 3: Write a basic test**

```ruby
# In a new file spec/jobs/import_session_cleanup_job_spec.rb
require "rails_helper"

RSpec.describe ImportSessionCleanupJob, type: :job do
  fixtures :organizations, :spaces, :organization_memberships

  let(:org) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:membership) { organization_memberships(:om_is_pawel) }

  it "destroys expired pending sessions" do
    expired = ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      expires_at: 1.day.ago
    )
    active = ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      expires_at: 1.day.from_now
    )

    described_class.perform_now

    expect(ImportSession.find_by(id: expired.id)).to be_nil
    expect(ImportSession.find_by(id: active.id)).to be_present
  end

  it "does not destroy completed sessions even if past expires_at" do
    completed = ImportSession.create!(
      organization: org, space: space,
      organization_membership: membership,
      status: :completed,
      expires_at: 1.day.ago
    )

    described_class.perform_now

    expect(ImportSession.find_by(id: completed.id)).to be_present
  end
end
```

**Step 4: Run tests**

```bash
bin/rspec spec/jobs/import_session_cleanup_job_spec.rb
```

Expected: All passing

**Step 5: Commit**

```bash
git add app/jobs/import_session_cleanup_job.rb \
        spec/jobs/import_session_cleanup_job_spec.rb \
        config/recurring.yml
git commit -m "Add ImportSessionCleanupJob with daily cron"
```

---

## Task 15: Web UI — ImportsController and views

**Files:**
- Modify: `app/controllers/imports_controller.rb` (new implementation)
- Create: `app/views/imports/index.html.erb`
- Create: `app/views/imports/new.html.erb`
- Create: `app/views/imports/show.html.erb`
- Create: `app/views/imports/_session_status.html.erb` (Turbo Stream partial)
- Modify: `config/routes.rb` (web UI routes)

**Step 1: Update web routes**

In `config/routes.rb`, inside `defaults export: true`, the `resources :import_sessions, only: [:index, :show]` added in Task 6 handles the web UI. Add a separate web route for creating via form:

```ruby
resources :import_sessions, only: [:index, :show, :new]
```

(Remove the duplicate `resources :imports` if still present)

**Step 2: Create ImportsController (web)**

Create `app/controllers/imports_controller.rb`:

```ruby
# frozen_string_literal: true

class ImportsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized

  def index
    @sessions = policy_scope(current_organization.import_sessions).recent
                  .includes(:space, :organization_membership)

    authorize ImportSession, :index?
  end

  def show
    @session = current_organization.import_sessions.find(params[:id])
    authorize @session, :show?
    @import_files = @session.import_files.order(:relative_path)
  end

  def new
    @session = current_organization.import_sessions.new
    @spaces = updatable_spaces
    authorize @session, :create?
  end

  private

  def updatable_spaces
    policy_scope(current_organization.spaces).select do |space|
      policy(space).update?
    end
  end
end
```

**Step 3: Create index view**

Create `app/views/imports/index.html.erb`:

```erb
<% content_for :focused_header do %>
  Imports
<% end %>

<% content_for :focused_header_buttons do %>
  <%= link_to "New Import", new_import_session_path, class: "primary-button" %>
<% end %>

<% content_for :focused_content do %>
  <% if @sessions.any? %>
    <div class="imports-list space-y-4">
      <% @sessions.each do |session| %>
        <div class="import-item border rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-semibold">
                <%= link_to session.space.name, import_session_path(session), class: "link" %>
              </h3>
              <div class="text-sm text-gray-600 mt-1">
                <span><%= session.source_format.capitalize %></span> •
                <span><%= session.organization_membership.display_name %></span> •
                <span><%= session.created_at.strftime("%b %d, %Y") %></span>
              </div>
              <div class="text-sm mt-1">
                <%= session.processed_files %> / <%= session.total_files %> processed
                <% if session.failed_files > 0 %>
                  • <span class="text-red-600"><%= session.failed_files %> failed</span>
                <% end %>
              </div>
            </div>
            <div>
              <%= render "imports/session_status", session: session %>
            </div>
          </div>
        </div>
      <% end %>
    </div>
  <% else %>
    <div class="empty-state text-center py-12">
      <h3 class="text-lg font-medium text-gray-900 mb-2">No imports yet</h3>
      <%= link_to "Start Import", new_import_session_path, class: "btn btn-primary" %>
    </div>
  <% end %>
<% end %>

<%= render "focused_section" %>
```

**Step 4: Create session status partial**

Create `app/views/imports/_session_status.html.erb`:

```erb
<div id="import_session_<%= session.id %>_status">
  <% case session.status %>
  <% when "pending", "uploading" %>
    <span class="badge badge-yellow">⏳ Uploading</span>
  <% when "processing" %>
    <span class="badge badge-blue">⚙ Processing</span>
  <% when "completed" %>
    <span class="badge badge-green">✓ Completed</span>
  <% when "partial" %>
    <span class="badge badge-orange">⚠ Partial</span>
  <% when "failed" %>
    <span class="badge badge-red">✗ Failed</span>
  <% end %>
</div>
```

**Step 5: Create new/setup view**

Create `app/views/imports/new.html.erb`:

```erb
<% content_for :focused_header do %>
  New Import
<% end %>

<% content_for :focused_content do %>
  <div class="max-w-2xl mx-auto"
       data-controller="import-upload"
       data-import-upload-api-url-value="<%= api_v1_import_sessions_path %>"
       data-import-upload-space-options-value="<%= @spaces.map { |s| { id: s.id, name: s.name } }.to_json %>">

    <%# Step 1: Configure %>
    <div data-import-upload-target="stepConfigure" class="import-step">
      <h2 class="text-xl font-semibold mb-4">Step 1: Configure</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Target Space</label>
        <select data-import-upload-target="spaceSelect" class="form-select w-full">
          <% @spaces.each do |space| %>
            <option value="<%= space.id %>"><%= space.name %></option>
          <% end %>
        </select>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Source Format</label>
        <select data-import-upload-target="formatSelect" class="form-select w-full">
          <option value="generic">Generic (Markdown / Word)</option>
          <option value="obsidian">Obsidian Vault</option>
        </select>
      </div>
      <button data-action="click->import-upload#nextStep" class="primary-button">
        Continue
      </button>
    </div>

    <%# Step 2: Select files %>
    <div data-import-upload-target="stepFiles" class="import-step hidden">
      <h2 class="text-xl font-semibold mb-4">Step 2: Select Files</h2>
      <div data-import-upload-target="dropZone"
           data-action="dragover->import-upload#dragOver drop->import-upload#drop"
           class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <p class="text-gray-500 mb-4">Drop a folder or files here</p>
        <div class="flex gap-4 justify-center">
          <label class="btn btn-secondary cursor-pointer">
            Select Folder
            <input type="file" webkitdirectory multiple class="hidden"
                   data-action="change->import-upload#filesSelected">
          </label>
          <label class="btn btn-secondary cursor-pointer">
            Select Files
            <input type="file" multiple class="hidden"
                   data-action="change->import-upload#filesSelected">
          </label>
        </div>
      </div>
      <div data-import-upload-target="fileSummary" class="mt-4 hidden">
        <p class="text-sm text-gray-700">
          <span data-import-upload-target="fileCount"></span> files selected
          (<span data-import-upload-target="totalSize"></span>)
        </p>
        <p data-import-upload-target="limitError" class="text-red-600 text-sm hidden"></p>
        <button data-action="click->import-upload#startUpload" class="primary-button mt-4">
          Start Upload
        </button>
      </div>
    </div>

    <%# Step 3: Uploading progress %>
    <div data-import-upload-target="stepUploading" class="import-step hidden">
      <h2 class="text-xl font-semibold mb-4">Step 3: Uploading</h2>
      <div class="mb-2 text-sm text-gray-600">
        Session ID: <code data-import-upload-target="sessionId" class="text-xs bg-gray-100 px-1 rounded"></code>
      </div>
      <div class="mb-4">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div data-import-upload-target="uploadBar"
               class="bg-blue-600 h-2 rounded-full transition-all" style="width: 0%"></div>
        </div>
        <p class="text-sm text-gray-600 mt-1">
          <span data-import-upload-target="uploadedCount">0</span> /
          <span data-import-upload-target="uploadTotal">0</span> files
        </p>
      </div>
    </div>

    <%# Step 4: Processing / complete %>
    <div data-import-upload-target="stepProcessing" class="import-step hidden">
      <h2 class="text-xl font-semibold mb-4">Step 4: Processing</h2>
      <p class="text-sm text-gray-600 mb-4">
        Files are being converted and imported. You can close this tab and return later.
      </p>
      <div data-import-upload-target="processingStatus"></div>
    </div>
  </div>
<% end %>

<%= render "focused_section" %>
```

**Step 6: Create show/log view**

Create `app/views/imports/show.html.erb`:

```erb
<% content_for :focused_header do %>
  Import — <%= @session.space.name %>
<% end %>

<% content_for :focused_header_buttons do %>
  <% if @session.failed_files > 0 %>
    <%= button_to "Retry Failed", retry_api_v1_import_session_path(@session),
        method: :post, class: "btn btn-secondary",
        data: { turbo: false } %>
  <% end %>
<% end %>

<% content_for :focused_content do %>
  <%= turbo_stream_from ["import_session", @session] %>

  <div class="mb-6">
    <%= render "imports/session_status", session: @session %>
    <div class="grid grid-cols-4 gap-4 mt-4 text-center">
      <div class="bg-gray-50 rounded p-3">
        <div class="text-2xl font-bold"><%= @session.total_files %></div>
        <div class="text-xs text-gray-500">Total</div>
      </div>
      <div class="bg-green-50 rounded p-3">
        <div class="text-2xl font-bold text-green-700"><%= @session.processed_files %></div>
        <div class="text-xs text-gray-500">Processed</div>
      </div>
      <div class="bg-red-50 rounded p-3">
        <div class="text-2xl font-bold text-red-700"><%= @session.failed_files %></div>
        <div class="text-xs text-gray-500">Failed</div>
      </div>
      <div class="bg-yellow-50 rounded p-3">
        <div class="text-2xl font-bold text-yellow-700"><%= @session.skipped_files %></div>
        <div class="text-xs text-gray-500">Skipped</div>
      </div>
    </div>
  </div>

  <div class="import-log">
    <h3 class="font-semibold mb-3">Import Log</h3>
    <table class="w-full text-sm">
      <thead>
        <tr class="text-left text-gray-500 border-b">
          <th class="pb-2">Path</th>
          <th class="pb-2">Status</th>
          <th class="pb-2">Result</th>
        </tr>
      </thead>
      <tbody>
        <% @import_files.each do |file| %>
          <tr class="border-b border-gray-100 py-2">
            <td class="py-2 font-mono text-xs text-gray-700"><%= file.relative_path %></td>
            <td class="py-2">
              <% case file.status %>
              <% when "completed" %><span class="text-green-600">✓</span>
              <% when "failed" %><span class="text-red-600">✗</span>
              <% when "skipped" %><span class="text-gray-400">⊘</span>
              <% else %><span class="text-yellow-500">⏳</span>
              <% end %>
            </td>
            <td class="py-2">
              <% if file.document %>
                <%= link_to file.document.title, document_path(file.document), class: "link text-xs" %>
              <% elsif file.error_message %>
                <span class="text-red-600 text-xs"><%= file.error_message.truncate(80) %></span>
              <% elsif file.attachment? %>
                <span class="text-gray-500 text-xs">Attached</span>
              <% end %>
            </td>
          </tr>
        <% end %>
      </tbody>
    </table>
  </div>
<% end %>

<%= render "focused_section" %>
```

**Step 7: Run tests**

```bash
bin/rspec
```

Expected: All passing

**Step 8: Commit**

```bash
git add app/controllers/imports_controller.rb app/views/imports/ config/routes.rb
git commit -m "Add web UI views for ImportSession"
```

---

## Task 16: Stimulus upload controller

**Files:**
- Create: `app/javascript/controllers/import_upload_controller.js`

**Step 1: Create the Stimulus controller**

Create `app/javascript/controllers/import_upload_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"

const MAX_FILES = 500
const MAX_TOTAL_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB
const UPLOAD_CONCURRENCY = 3

export default class extends Controller {
  static targets = [
    "stepConfigure", "stepFiles", "stepUploading", "stepProcessing",
    "spaceSelect", "formatSelect",
    "dropZone", "fileSummary", "fileCount", "totalSize", "limitError",
    "sessionId", "uploadBar", "uploadedCount", "uploadTotal",
    "processingStatus"
  ]

  static values = {
    apiUrl: String,
    spaceOptions: Array
  }

  connect() {
    this.files = [] // Array of { file, relativePath }
    this.sessionId = null
    this.uploadedCount = 0
  }

  // ── Step navigation ───────────────────────────────────────────────

  nextStep() {
    this.stepConfigureTarget.classList.add("hidden")
    this.stepFilesTarget.classList.remove("hidden")
  }

  // ── File selection ────────────────────────────────────────────────

  dragOver(event) {
    event.preventDefault()
    this.dropZoneTarget.classList.add("border-blue-500")
  }

  async drop(event) {
    event.preventDefault()
    this.dropZoneTarget.classList.remove("border-blue-500")
    const items = Array.from(event.dataTransfer.items)
    const entries = items.map(item => item.webkitGetAsEntry()).filter(Boolean)
    const collected = []
    for (const entry of entries) {
      await this.#collectEntry(entry, "", collected)
    }
    this.#setFiles(collected)
  }

  filesSelected(event) {
    const fileList = Array.from(event.target.files)
    const collected = fileList.map(f => ({
      file: f,
      relativePath: f.webkitRelativePath || f.name
    }))
    this.#setFiles(collected)
  }

  #setFiles(collected) {
    this.files = collected
    const totalBytes = collected.reduce((sum, f) => sum + f.file.size, 0)

    if (collected.length > MAX_FILES) {
      this.limitErrorTarget.textContent = `Too many files: ${collected.length} (max ${MAX_FILES})`
      this.limitErrorTarget.classList.remove("hidden")
      this.fileSummaryTarget.classList.remove("hidden")
      return
    }

    if (totalBytes > MAX_TOTAL_BYTES) {
      this.limitErrorTarget.textContent = `Total size too large: ${this.#formatBytes(totalBytes)} (max 1 GB)`
      this.limitErrorTarget.classList.remove("hidden")
      this.fileSummaryTarget.classList.remove("hidden")
      return
    }

    this.limitErrorTarget.classList.add("hidden")
    this.fileCountTarget.textContent = collected.length
    this.totalSizeTarget.textContent = this.#formatBytes(totalBytes)
    this.fileSummaryTarget.classList.remove("hidden")
  }

  async #collectEntry(entry, prefix, results) {
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve))
      results.push({ file, relativePath: prefix ? `${prefix}/${entry.name}` : entry.name })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await new Promise(resolve => reader.readEntries(resolve))
      for (const child of entries) {
        await this.#collectEntry(child, prefix ? `${prefix}/${entry.name}` : entry.name, results)
      }
    }
  }

  // ── Upload ────────────────────────────────────────────────────────

  async startUpload() {
    const spaceId = this.spaceSelectTarget.value
    const sourceFormat = this.formatSelectTarget.value

    this.stepFilesTarget.classList.add("hidden")
    this.stepUploadingTarget.classList.remove("hidden")

    // Create session
    const sessionRes = await fetch(this.apiUrlValue, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": this.#csrfToken() },
      body: JSON.stringify({ space_id: spaceId, source_format: sourceFormat })
    })
    const session = await sessionRes.json()
    this.sessionId = session.id
    this.sessionIdTarget.textContent = session.id

    // Submit manifest
    const manifest = await this.#buildManifest()
    const manifestRes = await fetch(`${this.apiUrlValue}/${session.id}/manifest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": this.#csrfToken() },
      body: JSON.stringify({ files: manifest })
    })
    const fileEntries = await manifestRes.json()

    const toUpload = fileEntries.filter(f => f.direct_upload_url)
    this.uploadTotalTarget.textContent = toUpload.length
    this.uploadedCountTarget.textContent = 0
    this.uploadedCount = 0

    // Upload with concurrency limit
    await this.#uploadWithConcurrency(toUpload, UPLOAD_CONCURRENCY, session.id)

    // Trigger processing
    await fetch(`${this.apiUrlValue}/${session.id}/process`, {
      method: "POST",
      headers: { "X-CSRF-Token": this.#csrfToken() }
    })

    this.stepUploadingTarget.classList.add("hidden")
    this.stepProcessingTarget.classList.remove("hidden")

    // Redirect to session show page
    window.location.href = `/import_sessions/${session.id}`
  }

  async #buildManifest() {
    return Promise.all(this.files.map(async ({ file, relativePath }) => {
      const checksum = await this.#sha256(file)
      return {
        relative_path: relativePath,
        checksum,
        file_size: file.size,
        format: this.#detectFormat(file.name),
        file_type: this.#isAttachment(file.name) ? "attachment" : "document"
      }
    }))
  }

  async #uploadWithConcurrency(entries, concurrency, sessionId) {
    const queue = [...entries]
    const workers = Array.from({ length: concurrency }, () => this.#worker(queue, sessionId))
    await Promise.all(workers)
  }

  async #worker(queue, sessionId) {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (!entry) break
      await this.#uploadFile(entry, sessionId)
    }
  }

  async #uploadFile(entry, sessionId) {
    const fileData = this.files.find(f => f.relativePath === entry.relative_path)
    if (!fileData) return

    await fetch(entry.direct_upload_url, {
      method: "PUT",
      headers: { "Content-Type": entry.content_type || "application/octet-stream" },
      body: fileData.file
    })

    await fetch(`${this.apiUrlValue}/${sessionId}/import_files/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": this.#csrfToken() },
      body: JSON.stringify({ status: "uploaded" })
    })

    this.uploadedCount++
    this.uploadedCountTarget.textContent = this.uploadedCount
    const pct = Math.round((this.uploadedCount / parseInt(this.uploadTotalTarget.textContent)) * 100)
    this.uploadBarTarget.style.width = `${pct}%`
  }

  // ── Utilities ─────────────────────────────────────────────────────

  async #sha256(file) {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  }

  #detectFormat(filename) {
    const ext = filename.split(".").pop().toLowerCase()
    const docFormats = { md: "markdown", docx: "docx", odt: "odt", doc: "doc" }
    const attachFormats = { png: "image", jpg: "image", jpeg: "image", gif: "image",
                             webp: "image", svg: "image", pdf: "pdf",
                             mp4: "video", mov: "video", avi: "video" }
    return docFormats[ext] || attachFormats[ext] || "other"
  }

  #isAttachment(filename) {
    const attachExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "pdf", "mp4", "mov", "avi",
                        "zip", "tar", "gz", "xlsx", "csv"]
    const ext = filename.split(".").pop().toLowerCase()
    return attachExts.includes(ext)
  }

  #formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  #csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content
  }
}
```

**Step 2: Register in Stimulus**

In `app/javascript/controllers/index.js`, add:

```javascript
import ImportUploadController from "./import_upload_controller"
application.register("import-upload", ImportUploadController)
```

**Step 3: Verify in browser**

```bash
bin/dev
```

Navigate to `/import_sessions/new` and verify the multi-step form renders and the drag-and-drop zone appears.

**Step 4: Commit**

```bash
git add app/javascript/controllers/import_upload_controller.js \
        app/javascript/controllers/index.js
git commit -m "Add Stimulus import upload controller"
```

---

## Task 17: CLI — new import command group

**Files:**
- Modify: `/home/pawel/Development/Ikigai-Systems/fundamento-cli/src/cli.js`
- Create: `/home/pawel/Development/Ikigai-Systems/fundamento-cli/src/import_session.js`
- Modify: `/home/pawel/Development/Ikigai-Systems/fundamento-cli/src/client.js`

**Step 1: Add API methods to client**

In `fundamento-cli/src/client.js`, add:

```javascript
async createImportSession({ spaceId, sourceFormat = "generic", settings = {} }) {
  return this.post("/api/v1/import_sessions", {
    space_id: spaceId,
    source_format: sourceFormat,
    settings
  })
}

async submitManifest(sessionId, files) {
  return this.post(`/api/v1/import_sessions/${sessionId}/manifest`, { files })
}

async markFileUploaded(sessionId, fileId) {
  return this.patch(`/api/v1/import_sessions/${sessionId}/import_files/${fileId}`, {
    status: "uploaded"
  })
}

async triggerProcessing(sessionId) {
  return this.post(`/api/v1/import_sessions/${sessionId}/process`)
}

async getImportSession(sessionId) {
  return this.get(`/api/v1/import_sessions/${sessionId}`)
}

async cancelImportSession(sessionId) {
  return this.delete(`/api/v1/import_sessions/${sessionId}`)
}

async retryImportSession(sessionId) {
  return this.post(`/api/v1/import_sessions/${sessionId}/retry`)
}
```

**Step 2: Create ImportSession orchestrator**

Create `fundamento-cli/src/import_session.js`:

```javascript
import fs from "fs"
import path from "path"
import crypto from "crypto"
import fetch from "node-fetch"

const SESSION_FILE = ".fundamento-session.json"
const MAX_CONCURRENCY = 5
const DOCUMENT_EXTS = new Set([".md", ".docx", ".odt", ".doc"])
const ATTACHMENT_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
                                   ".pdf", ".mp4", ".mov", ".avi"])

export class ImportSessionManager {
  constructor(client, options = {}) {
    this.client = client
    this.concurrency = options.concurrency || MAX_CONCURRENCY
    this.ignorePatterns = options.ignore || []
  }

  async start(spaceId, directory, { format, sessionFile } = {}) {
    const sessionFilePath = sessionFile || path.join(directory, SESSION_FILE)
    let sessionId = this.#loadSessionId(sessionFilePath)

    if (sessionId) {
      console.log(`Resuming session: ${sessionId}`)
    }

    // Detect Obsidian vault
    const sourceFormat = format ||
      (fs.existsSync(path.join(directory, ".obsidian")) ? "obsidian" : "generic")

    if (sourceFormat === "obsidian" && !format) {
      console.log("Detected Obsidian vault — using Obsidian format")
    }

    // Scan files
    process.stdout.write("Scanning files... ")
    const files = this.#scanDirectory(directory)
    console.log(`${files.length} files found (${this.#formatBytes(files.reduce((s, f) => s + f.size, 0))})`)

    // Create or resume session
    if (!sessionId) {
      const session = await this.client.createImportSession({ spaceId, sourceFormat })
      sessionId = session.id
      this.#saveSessionId(sessionFilePath, { session_id: sessionId, space_id: spaceId })
      console.log(`Session ID: ${sessionId}`)
    }

    // Submit manifest
    process.stdout.write("Submitting manifest... ")
    const manifest = await this.#buildManifest(files, directory)
    const fileEntries = await this.client.submitManifest(sessionId, manifest)

    const toUpload = fileEntries.filter(f => f.direct_upload_url)
    const alreadyDone = fileEntries.length - toUpload.length
    console.log(`${toUpload.length} files to upload (${alreadyDone} already uploaded)`)

    if (toUpload.length === 0) {
      console.log("All files already uploaded. Triggering processing...")
    } else {
      // Upload files with progress
      await this.#uploadFiles(toUpload, files, directory, sessionId)
    }

    // Trigger processing
    await this.client.triggerProcessing(sessionId)
    console.log("\nAll files uploaded. Processing started.")
    console.log(`Session ID: ${sessionId}  (run \`funcli import cancel ${sessionId}\` to cancel)`)

    // Poll for completion
    await this.#pollProgress(sessionId)
  }

  async status(sessionId) {
    const session = await this.client.getImportSession(sessionId)
    console.log(`\nSession: ${sessionId}`)
    console.log(`Status: ${session.status}`)
    console.log(`Progress: ${session.processed_files} / ${session.total_files} processed`)
    if (session.failed_files > 0) {
      console.log(`Failed: ${session.failed_files}`)
    }
  }

  async cancel(sessionId) {
    await this.client.cancelImportSession(sessionId)
    console.log(`Session ${sessionId} cancelled.`)
  }

  async retry(sessionId) {
    await this.client.retryImportSession(sessionId)
    console.log(`Retrying failed files in session ${sessionId}...`)
    await this.#pollProgress(sessionId)
  }

  async log(sessionId, { failedOnly = false, json = false } = {}) {
    const session = await this.client.getImportSession(sessionId)
    let files = session.files || []
    if (failedOnly) files = files.filter(f => f.status === "failed")

    if (json) {
      console.log(JSON.stringify(files, null, 2))
      return
    }

    console.log(`\nImport Log — ${sessionId}\n${"─".repeat(60)}`)
    for (const f of files) {
      const icon = { completed: "✓", failed: "✗", skipped: "⊘" }[f.status] || "⏳"
      const detail = f.document_id ? `→ ${f.document_id}` : (f.error_message || "")
      console.log(`  ${icon} ${f.relative_path.padEnd(50)} ${detail}`)
    }
  }

  // ── Private ────────────────────────────────────────────────────────

  #scanDirectory(dir, prefix = "") {
    const results = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name

      if (this.#shouldIgnore(entry.name)) continue

      if (entry.isDirectory()) {
        results.push(...this.#scanDirectory(fullPath, relativePath))
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (DOCUMENT_EXTS.has(ext) || ATTACHMENT_EXTS.has(ext)) {
          const stat = fs.statSync(fullPath)
          results.push({ fullPath, relativePath, size: stat.size, ext })
        }
      }
    }
    return results
  }

  async #buildManifest(files, directory) {
    return Promise.all(files.map(async (f) => {
      const checksum = await this.#sha256(f.fullPath)
      const ext = f.ext.slice(1)
      return {
        relative_path: f.relativePath,
        checksum,
        file_size: f.size,
        format: this.#detectFormat(ext),
        file_type: ATTACHMENT_EXTS.has(f.ext) ? "attachment" : "document"
      }
    }))
  }

  async #uploadFiles(toUpload, allFiles, directory, sessionId) {
    let done = 0
    const total = toUpload.length
    const queue = [...toUpload]

    const worker = async () => {
      while (queue.length > 0) {
        const entry = queue.shift()
        if (!entry) break
        const local = allFiles.find(f => f.relativePath === entry.relative_path)
        if (!local) continue

        await this.#uploadFile(entry, local.fullPath, sessionId)
        done++
        this.#printProgress(done, total)
      }
    }

    const workers = Array.from({ length: this.concurrency }, worker)
    await Promise.all(workers)
    process.stdout.write("\n")
  }

  async #uploadFile(entry, filePath, sessionId) {
    const fileBuffer = fs.readFileSync(filePath)
    await fetch(entry.direct_upload_url, {
      method: "PUT",
      headers: { "Content-Type": entry.content_type || "application/octet-stream" },
      body: fileBuffer
    })
    await this.client.markFileUploaded(sessionId, entry.id)
  }

  async #pollProgress(sessionId) {
    process.stdout.write("\nProcessing ")
    while (true) {
      await new Promise(r => setTimeout(r, 2000))
      const session = await this.client.getImportSession(sessionId)
      const pct = session.total_files > 0
        ? Math.round((session.processed_files / session.total_files) * 100)
        : 0
      process.stdout.write(`\rProcessing  ${this.#progressBar(pct)}  ${pct}%   ${session.processed_files} / ${session.total_files}`)

      if (["completed", "partial", "failed"].includes(session.status)) {
        console.log(`\n\n✓ Import ${session.status}  (${session.failed_files} failed, ${session.processed_files} imported)`)
        break
      }
    }
  }

  #progressBar(pct, width = 20) {
    const filled = Math.round(width * pct / 100)
    return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]"
  }

  #printProgress(done, total) {
    const pct = Math.round(done / total * 100)
    process.stdout.write(`\rUploading  ${this.#progressBar(pct)}  ${pct}%   ${done} / ${total}`)
  }

  #shouldIgnore(name) {
    for (const pattern of this.ignorePatterns) {
      if (new RegExp(pattern.replace("*", ".*")).test(name)) return true
    }
    return name.startsWith(".")
  }

  async #sha256(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256")
      const stream = fs.createReadStream(filePath)
      stream.on("data", d => hash.update(d))
      stream.on("end", () => resolve(hash.digest("hex")))
      stream.on("error", reject)
    })
  }

  #detectFormat(ext) {
    const map = { md: "markdown", docx: "docx", odt: "odt", doc: "doc",
                  png: "image", jpg: "image", jpeg: "image", gif: "image",
                  webp: "image", svg: "image", pdf: "pdf",
                  mp4: "video", mov: "video", avi: "video" }
    return map[ext] || "other"
  }

  #formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  #loadSessionId(sessionFilePath) {
    if (!fs.existsSync(sessionFilePath)) return null
    try {
      return JSON.parse(fs.readFileSync(sessionFilePath, "utf8")).session_id
    } catch { return null }
  }

  #saveSessionId(sessionFilePath, data) {
    fs.writeFileSync(sessionFilePath, JSON.stringify(data, null, 2))
  }
}
```

**Step 3: Register new import commands in cli.js**

In `fundamento-cli/src/cli.js`, add this block after the `documentsCommand` block:

```javascript
import { ImportSessionManager } from "./import_session.js"

const importCommand = program
  .command("import")
  .description("Batch import documents and files")

importCommand
  .command("start <space-id> <directory>")
  .description("Import a directory into a space")
  .option("--format <format>", "Source format: generic or obsidian (auto-detected)")
  .option("--concurrency <n>", "Parallel uploads", "5")
  .option("--ignore <glob>", "Ignore pattern (repeatable)", (v, prev) => [...(prev||[]), v], [])
  .option("--session-file <path>", "Session state file path")
  .action(withClient(async (client, spaceId, directory, options) => {
    const manager = new ImportSessionManager(client, {
      concurrency: parseInt(options.concurrency),
      ignore: options.ignore
    })
    await manager.start(spaceId, directory, {
      format: options.format,
      sessionFile: options.sessionFile
    })
  }))

importCommand
  .command("status <session-id>")
  .description("Show import session status")
  .action(withClient(async (client, sessionId) => {
    const manager = new ImportSessionManager(client)
    await manager.status(sessionId)
  }))

importCommand
  .command("cancel <session-id>")
  .description("Cancel an import session")
  .action(withClient(async (client, sessionId) => {
    const manager = new ImportSessionManager(client)
    await manager.cancel(sessionId)
  }))

importCommand
  .command("retry <session-id>")
  .description("Retry failed files in a session")
  .action(withClient(async (client, sessionId) => {
    const manager = new ImportSessionManager(client)
    await manager.retry(sessionId)
  }))

importCommand
  .command("log <session-id>")
  .description("Show import log for a session")
  .option("--failed-only", "Show only failed files")
  .option("--json", "Output as JSON")
  .action(withClient(async (client, sessionId, options) => {
    const manager = new ImportSessionManager(client)
    await manager.log(sessionId, { failedOnly: options.failedOnly, json: options.json })
  }))
```

Also remove the old `documents import` command.

**Step 4: Smoke test**

```bash
cd /home/pawel/Development/Ikigai-Systems/fundamento-cli
node src/cli.js import --help
```

Expected: Shows `start`, `status`, `cancel`, `retry`, `log` subcommands

**Step 5: Commit**

```bash
cd /home/pawel/Development/Ikigai-Systems/fundamento-cli
git add src/cli.js src/import_session.js src/client.js
git commit -m "Add import command group with manifest-based resumable uploads"
```

---

## Task 18: Final wiring — Good Job queue config and full test run

**Files:**
- Modify: `config/good_job.yml` or `config/application.rb` (add `:imports` queue)

**Step 1: Register the imports queue**

Good Job processes all queues by default. If you have an explicit queue list in
`config/good_job.yml` or environment config, add `imports` to it:

```yaml
# config/good_job.yml (if it exists)
queues: "default,imports,maintenance"
```

**Step 2: Run full test suite**

```bash
bin/rspec
```

Expected: All passing. Fix any test failures before continuing.

**Step 3: Smoke test end-to-end with dev server**

```bash
bin/dev
```

1. Navigate to `/import_sessions/new`
2. Select a space and format
3. Drop a small folder of markdown files
4. Watch upload progress
5. Verify documents appear in the space

**Step 4: Final commit**

```bash
git add -A
git commit -m "Batch import system complete — ImportSession + ImportFile pipeline"
```

# Reddit Conversion API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Send server-side SIGN_UP and PAGE_VISIT conversion events to Reddit CAPI v3, bypassing ad blockers.

**Architecture:** A `RedditConversionService` wraps the Reddit CAPI v3 HTTP call. A `RedditConversionJob` (Good Job) enqueues async, with a `before_enqueue` guard that silently aborts when credentials are missing. The `rdt_cid` cookie is captured via hidden field at registration and stored on the User model.

**Tech Stack:** Rails 8.1, Good Job, Net::HTTP, SHA256 hashing

---

### Task 1: Migration — Add `reddit_click_id` to users

**Files:**
- Create: `db/migrate/XXXXXX_add_reddit_click_id_to_users.rb`

**Step 1: Generate the migration**

Run: `bin/rails generate migration AddRedditClickIdToUsers reddit_click_id:string`

**Step 2: Verify the migration file**

The generated migration should contain:

```ruby
class AddRedditClickIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :reddit_click_id, :string
  end
end
```

**Step 3: Run the migration**

Run: `bin/rails db:migrate`
Expected: schema.rb updated with `reddit_click_id` column on users table.

**Step 4: Commit**

```bash
git add db/migrate/*_add_reddit_click_id_to_users.rb db/schema.rb
git commit -m "feat: add reddit_click_id column to users table"
```

---

### Task 2: RedditConversionService

**Files:**
- Create: `app/services/reddit_conversion_service.rb`
- Test: `spec/services/reddit_conversion_service_spec.rb`

**Step 1: Write the failing tests**

```ruby
# spec/services/reddit_conversion_service_spec.rb
require "rails_helper"

RSpec.describe RedditConversionService do
  let(:service) { described_class.new }

  describe ".enabled?" do
    it "returns true when both pixel_id and conversion_access_token are configured" do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return("pixel123")
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return("token123")

      expect(described_class.enabled?).to be true
    end

    it "returns false when pixel_id is missing" do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return(nil)
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return("token123")

      expect(described_class.enabled?).to be false
    end

    it "returns false when conversion_access_token is missing" do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return("pixel123")
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return(nil)

      expect(described_class.enabled?).to be false
    end
  end

  describe "#send_event" do
    let(:event_params) do
      {
        event_type: "SignUp",
        email: "user@example.com",
        click_id: "rdt_abc123",
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0",
        conversion_id: "conv_123"
      }
    end

    before do
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :pixel_id).and_return("pixel123")
      allow(Rails.application.credentials).to receive(:dig).with(:reddit, :conversion_access_token).and_return("token123")
    end

    it "sends a POST request to Reddit CAPI v3 with correct payload" do
      stub = stub_request(:post, "https://ads-api.reddit.com/api/v3/conversions/events/pixel123")
        .with(
          headers: {
            "Authorization" => "Bearer token123",
            "Content-Type" => "application/json"
          },
          body: hash_including(
            "events" => [hash_including(
              "event_type" => { "tracking_type" => "SignUp" },
              "user" => hash_including(
                "email" => Digest::SHA256.hexdigest("user@example.com"),
                "ip_address" => "1.2.3.4",
                "user_agent" => "Mozilla/5.0"
              ),
              "click_id" => "rdt_abc123",
              "event_metadata" => { "conversion_id" => "conv_123" }
            )]
          )
        )
        .to_return(status: 200, body: '{"success": true}')

      service.send_event(**event_params)

      expect(stub).to have_been_requested
    end

    it "hashes email as lowercase SHA256" do
      stub = stub_request(:post, "https://ads-api.reddit.com/api/v3/conversions/events/pixel123")
        .to_return(status: 200, body: '{"success": true}')

      service.send_event(**event_params.merge(email: "User@Example.COM"))

      expect(stub).to have_been_requested
      body = JSON.parse(WebMock::RequestRegistry.instance.requested_signatures.hash.keys.last.body)
      expect(body["events"][0]["user"]["email"]).to eq(Digest::SHA256.hexdigest("user@example.com"))
    end

    it "omits click_id when nil" do
      stub = stub_request(:post, "https://ads-api.reddit.com/api/v3/conversions/events/pixel123")
        .to_return(status: 200, body: '{"success": true}')

      service.send_event(**event_params.merge(click_id: nil))

      body = JSON.parse(WebMock::RequestRegistry.instance.requested_signatures.hash.keys.last.body)
      expect(body["events"][0]).not_to have_key("click_id")
    end

    it "raises an error on non-2xx response" do
      stub_request(:post, "https://ads-api.reddit.com/api/v3/conversions/events/pixel123")
        .to_return(status: 500, body: '{"error": "internal"}')

      expect { service.send_event(**event_params) }.to raise_error(RedditConversionService::ApiError)
    end
  end
end
```

**Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/services/reddit_conversion_service_spec.rb`
Expected: FAIL — `uninitialized constant RedditConversionService`

**Step 3: Write the implementation**

```ruby
# app/services/reddit_conversion_service.rb
class RedditConversionService
  API_BASE_URL = "https://ads-api.reddit.com/api/v3/conversions/events"

  class ApiError < StandardError; end

  def self.enabled?
    pixel_id.present? && conversion_access_token.present?
  end

  def send_event(event_type:, email:, ip_address:, user_agent:, click_id: nil, conversion_id: nil)
    uri = URI("#{API_BASE_URL}/#{self.class.pixel_id}")

    event = {
      "event_at" => Time.current.iso8601,
      "event_type" => { "tracking_type" => event_type },
      "user" => {
        "email" => Digest::SHA256.hexdigest(email.downcase),
        "ip_address" => ip_address,
        "user_agent" => user_agent
      },
      "event_metadata" => { "conversion_id" => conversion_id || SecureRandom.uuid }
    }
    event["click_id"] = click_id if click_id.present?

    response = Net::HTTP.post(
      uri,
      { "events" => [event] }.to_json,
      "Authorization" => "Bearer #{self.class.conversion_access_token}",
      "Content-Type" => "application/json"
    )

    unless response.is_a?(Net::HTTPSuccess)
      raise ApiError, "Reddit CAPI returned #{response.code}: #{response.body}"
    end

    response
  end

  private

  def self.pixel_id
    Rails.application.credentials.dig(:reddit, :pixel_id)
  end

  def self.conversion_access_token
    Rails.application.credentials.dig(:reddit, :conversion_access_token)
  end
end
```

**Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/services/reddit_conversion_service_spec.rb`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add app/services/reddit_conversion_service.rb spec/services/reddit_conversion_service_spec.rb
git commit -m "feat: add RedditConversionService for CAPI v3 integration"
```

---

### Task 3: RedditConversionJob

**Files:**
- Create: `app/jobs/reddit_conversion_job.rb`
- Test: `spec/jobs/reddit_conversion_job_spec.rb`

**Step 1: Write the failing tests**

```ruby
# spec/jobs/reddit_conversion_job_spec.rb
require "rails_helper"

RSpec.describe RedditConversionJob, type: :job do
  fixtures :users

  let(:user) { users(:pawel) }

  describe "before_enqueue guard" do
    it "does not enqueue when RedditConversionService is disabled" do
      allow(RedditConversionService).to receive(:enabled?).and_return(false)

      expect {
        described_class.perform_later(
          event_type: "SignUp",
          user_id: user.id,
          ip_address: "1.2.3.4",
          user_agent: "Mozilla/5.0"
        )
      }.not_to have_enqueued_job(described_class)
    end

    it "enqueues when RedditConversionService is enabled" do
      allow(RedditConversionService).to receive(:enabled?).and_return(true)

      expect {
        described_class.perform_later(
          event_type: "SignUp",
          user_id: user.id,
          ip_address: "1.2.3.4",
          user_agent: "Mozilla/5.0"
        )
      }.to have_enqueued_job(described_class)
    end
  end

  describe "#perform" do
    let(:service) { instance_double(RedditConversionService) }

    before do
      allow(RedditConversionService).to receive(:new).and_return(service)
      allow(RedditConversionService).to receive(:enabled?).and_return(true)
    end

    it "calls the service with correct parameters for SignUp" do
      expect(service).to receive(:send_event).with(
        event_type: "SignUp",
        email: user.email,
        click_id: user.reddit_click_id,
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0",
        conversion_id: anything
      )

      described_class.perform_now(
        event_type: "SignUp",
        user_id: user.id,
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0"
      )
    end

    it "silently discards if user is not found" do
      expect(service).not_to receive(:send_event)

      described_class.perform_now(
        event_type: "SignUp",
        user_id: "nonexistent",
        ip_address: "1.2.3.4",
        user_agent: "Mozilla/5.0"
      )
    end
  end
end
```

**Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/jobs/reddit_conversion_job_spec.rb`
Expected: FAIL — `uninitialized constant RedditConversionJob`

**Step 3: Write the implementation**

```ruby
# app/jobs/reddit_conversion_job.rb
class RedditConversionJob < ApplicationJob
  before_enqueue do |job|
    throw :abort unless RedditConversionService.enabled?
  end

  retry_on RedditConversionService::ApiError, wait: :polynomially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  def perform(event_type:, user_id:, ip_address:, user_agent:)
    user = User.find_by(id: user_id)
    return unless user

    RedditConversionService.new.send_event(
      event_type: event_type,
      email: user.email,
      click_id: user.reddit_click_id,
      ip_address: ip_address,
      user_agent: user_agent,
      conversion_id: "#{event_type}_#{user_id}_#{Time.current.to_i}"
    )
  end
end
```

**Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/jobs/reddit_conversion_job_spec.rb`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add app/jobs/reddit_conversion_job.rb spec/jobs/reddit_conversion_job_spec.rb
git commit -m "feat: add RedditConversionJob with before_enqueue guard"
```

---

### Task 4: Capture `rdt_cid` cookie at registration

**Files:**
- Modify: `app/views/devise/registrations/new.html.erb` (add hidden field + JS)
- Modify: `app/controllers/users/registrations_controller.rb:27` (permit param)
- Test: `spec/requests/registrations_spec.rb` (or create if doesn't exist)

**Step 1: Check for existing registration request specs**

Run: `find spec -name "*registration*" -type f` to locate existing specs.

**Step 2: Write the failing test**

Create or add to the registration spec:

```ruby
# spec/requests/registrations_spec.rb (create if needed)
require "rails_helper"

RSpec.describe "User Registration", type: :request do
  describe "POST /users" do
    it "saves reddit_click_id from the form" do
      post user_registration_path, params: {
        user: {
          email: "newuser@example.com",
          password: "password123",
          password_confirmation: "password123",
          reddit_click_id: "rdt_abc123"
        }
      }

      user = User.find_by(email: "newuser@example.com")
      expect(user.reddit_click_id).to eq("rdt_abc123")
    end

    it "works without reddit_click_id" do
      post user_registration_path, params: {
        user: {
          email: "newuser2@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }

      user = User.find_by(email: "newuser2@example.com")
      expect(user).to be_present
      expect(user.reddit_click_id).to be_nil
    end
  end
end
```

**Step 3: Run test to verify it fails**

Run: `bin/rspec spec/requests/registrations_spec.rb`
Expected: FAIL — `reddit_click_id` not saved (unpermitted parameter)

**Step 4: Permit the parameter in the controller**

Modify `app/controllers/users/registrations_controller.rb:27`:

```ruby
# Change this line:
devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name])
# To:
devise_parameter_sanitizer.permit(:sign_up, keys: %i[first_name last_name reddit_click_id])
```

**Step 5: Add hidden field with JS to the registration form**

Add before the closing `<% end %>` of the form (before line 85 in `app/views/devise/registrations/new.html.erb`), inside the form block:

```erb
    <%= f.hidden_field :reddit_click_id, id: "reddit-click-id-field" %>

    <script>
      (function() {
        var match = document.cookie.match(/(?:^|;\s*)rdt_cid=([^;]*)/);
        if (match) {
          var field = document.getElementById("reddit-click-id-field");
          if (field) field.value = decodeURIComponent(match[1]);
        }
      })();
    </script>
```

**Step 6: Run tests to verify they pass**

Run: `bin/rspec spec/requests/registrations_spec.rb`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add app/controllers/users/registrations_controller.rb app/views/devise/registrations/new.html.erb spec/requests/registrations_spec.rb
git commit -m "feat: capture Reddit click ID cookie at registration"
```

---

### Task 5: Hook SIGN_UP event into registration

**Files:**
- Modify: `app/controllers/users/registrations_controller.rb`
- Test: Add to `spec/requests/registrations_spec.rb`

**Step 1: Write the failing test**

Add to `spec/requests/registrations_spec.rb`:

```ruby
describe "Reddit CAPI SIGN_UP event" do
  it "enqueues RedditConversionJob after successful registration" do
    allow(RedditConversionService).to receive(:enabled?).and_return(true)

    expect {
      post user_registration_path, params: {
        user: {
          email: "reddit-test@example.com",
          password: "password123",
          password_confirmation: "password123",
          reddit_click_id: "rdt_abc123"
        }
      }
    }.to have_enqueued_job(RedditConversionJob).with(
      event_type: "SignUp",
      user_id: anything,
      ip_address: anything,
      user_agent: anything
    )
  end

  it "does not enqueue when RedditConversionService is disabled" do
    allow(RedditConversionService).to receive(:enabled?).and_return(false)

    expect {
      post user_registration_path, params: {
        user: {
          email: "reddit-test2@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    }.not_to have_enqueued_job(RedditConversionJob)
  end
end
```

**Step 2: Run test to verify it fails**

Run: `bin/rspec spec/requests/registrations_spec.rb`
Expected: FAIL — no job enqueued

**Step 3: Add the hook to the controller**

In `app/controllers/users/registrations_controller.rb`, override the Devise `after_sign_up_path_for` or use the `create` action. Since Devise calls `after_sign_up_path_for` on successful active sign-up, and `after_inactive_sign_up_path_for` when confirmation is required, we need to hook into both. The cleanest approach is an `after_action` on `create`:

Add after `before_action :configure_permitted_parameters` (line 4):

```ruby
after_action :enqueue_reddit_sign_up_event, only: [:create]
```

Add to the private/protected section:

```ruby
def enqueue_reddit_sign_up_event
  return unless resource.persisted?

  RedditConversionJob.perform_later(
    event_type: "SignUp",
    user_id: resource.id,
    ip_address: request.remote_ip,
    user_agent: request.user_agent
  )
end
```

**Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/requests/registrations_spec.rb`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add app/controllers/users/registrations_controller.rb spec/requests/registrations_spec.rb
git commit -m "feat: enqueue Reddit SIGN_UP event on user registration"
```

---

### Task 6: Hook PAGE_VISIT event for first space home visit

**Files:**
- Modify: `app/controllers/documents_controller.rb`
- Test: `spec/requests/documents_reddit_page_visit_spec.rb`

This is the most nuanced hook. The PAGE_VISIT event should fire when:
1. The user visits a document
2. That document is a home document of a space
3. That space belongs to the user's first organization (auto-created)
4. The user has **never visited this document before** (checked via ObjectVisitor)

Since `TrackObjectVisit` runs as both `before_action` and `after_action`, and uses `find_or_initialize_by`, we can check if the ObjectVisitor was newly created (i.e., this is the first visit).

**Step 1: Write the failing test**

```ruby
# spec/requests/documents_reddit_page_visit_spec.rb
require "rails_helper"

RSpec.describe "Reddit PAGE_VISIT on first space home visit", type: :request do
  fixtures :organizations, :users, :organization_memberships, :spaces, :space_memberships, :documents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:one) }
  let(:space) { spaces(:one) }

  before do
    sign_in user
    allow(RedditConversionService).to receive(:enabled?).and_return(true)
  end

  it "enqueues PAGE_VISIT when user first visits a space home document" do
    home_doc = space.home_document
    next skip("Space has no home document") unless home_doc

    # Ensure no prior visit exists
    ObjectVisitor.where(user: user, object: home_doc).delete_all

    expect {
      get document_path(home_doc)
    }.to have_enqueued_job(RedditConversionJob).with(
      event_type: "PageVisit",
      user_id: user.id,
      ip_address: anything,
      user_agent: anything
    )
  end

  it "does not enqueue PAGE_VISIT on subsequent visits" do
    home_doc = space.home_document
    next skip("Space has no home document") unless home_doc

    # Create a prior visit
    user.visit_object(home_doc)

    expect {
      get document_path(home_doc)
    }.not_to have_enqueued_job(RedditConversionJob)
  end

  it "does not enqueue PAGE_VISIT for non-home documents" do
    regular_doc = space.documents.where.not(id: space.home_document_id).first
    next skip("No non-home document available") unless regular_doc

    expect {
      get document_path(regular_doc)
    }.not_to have_enqueued_job(RedditConversionJob)
  end
end
```

**Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/requests/documents_reddit_page_visit_spec.rb`
Expected: FAIL — no job enqueued

**Step 3: Add the hook to DocumentsController**

Add an `after_action` to `app/controllers/documents_controller.rb`. Add after the existing includes (around line 3):

```ruby
after_action :enqueue_reddit_page_visit_event, only: [:show]
```

Add to the private section:

```ruby
def enqueue_reddit_page_visit_event
  return unless @document
  return unless @document.space&.home_document_id == @document.id
  return if ObjectVisitor.where(user: current_user, object: @document).where("visited_at < ?", 1.minute.ago).exists?

  RedditConversionJob.perform_later(
    event_type: "PageVisit",
    user_id: current_user.id,
    ip_address: request.remote_ip,
    user_agent: request.user_agent
  )
end
```

Note: The `visited_at < 1.minute.ago` check works because `TrackObjectVisit` runs as a `before_action` and creates/updates the ObjectVisitor record. If the record existed before this request, its `visited_at` will be older than the current request. If it was just created by `TrackObjectVisit` in this same request, it will be very recent (within the last second). So we check: if no ObjectVisitor existed before this request started (i.e., none with `visited_at` before now), this is the first visit.

Actually, a cleaner approach: check if the ObjectVisitor was created in the last few seconds (meaning it was just created by the before_action in this request). Let's simplify:

```ruby
def enqueue_reddit_page_visit_event
  return unless @document
  return unless @document.space&.home_document_id == @document.id

  visitor = ObjectVisitor.find_by(user: current_user, object: @document)
  return unless visitor
  # If visited_at is within the last 5 seconds, this visit just created the record
  return unless visitor.visited_at >= 5.seconds.ago
  # But if the record was created before this request, skip
  # The simplest check: was there a visitor record before TrackObjectVisit ran?
  # Since TrackObjectVisit uses find_or_initialize_by + update!, we can't distinguish.
  # Instead, use created_at if available, or count visits.
end
```

Simpler approach — use a dedicated check without relying on TrackObjectVisit timing:

```ruby
def enqueue_reddit_page_visit_event
  return unless @document
  return unless @document.space&.home_document_id == @document.id
  return if @document_visit_already_existed

  RedditConversionJob.perform_later(
    event_type: "PageVisit",
    user_id: current_user.id,
    ip_address: request.remote_ip,
    user_agent: request.user_agent
  )
end
```

And add a `before_action` that runs **before** `TrackObjectVisit`:

```ruby
before_action :check_existing_document_visit, only: [:show]

def check_existing_document_visit
  return unless @document
  @document_visit_already_existed = ObjectVisitor.exists?(user: current_user, object: @document)
end
```

This `before_action` must be declared **after** `load_document` but the order depends on Rails callback chain. Since `load_document` is `before_action :load_document, except: [...]` and TrackObjectVisit adds its own before_action via the concern, we need to ensure proper ordering. The safest approach is to check before TrackObjectVisit creates the record.

Looking at the controller setup:
- Line 3: `include TrackObjectVisit.for_instance_variable(:@document)` — this adds before_action and after_action
- Line 10: `before_action :load_document, except: [...]` — this loads @document

TrackObjectVisit's before_action has `if: -> { instance_variable_defined?(:@document) }`, so it only runs after @document is loaded. Rails runs before_actions in declaration order, so:
1. TrackObjectVisit before_action (skipped — @document not set yet)
2. load_document (sets @document)
3. TrackObjectVisit doesn't re-run as before_action

Wait — let me re-read TrackObjectVisit. It registers as both before_action AND after_action. The before_action won't find @document (not loaded yet). The after_action will find it and track. So we can safely add a before_action after load_document to check.

Actually, looking more carefully at the concern: the `before_action` and `after_action` both have `if: -> { instance_variable_defined?(variable_name) }`. The before_action runs before load_document in declaration order, so @document isn't set yet and it skips. The after_action runs after the action and @document IS set, so it tracks.

This means: add our check as a `before_action` after `load_document`. It will run after @document is loaded but before the action body. TrackObjectVisit hasn't created the record yet (it does so in after_action). So we can check cleanly:

```ruby
before_action :check_existing_document_visit, only: [:show]

def check_existing_document_visit
  return unless @document
  @document_visit_already_existed = ObjectVisitor.exists?(user: current_user, object: @document)
end
```

Declare this **after** `before_action :load_document`. Then in the after_action:

```ruby
after_action :enqueue_reddit_page_visit_event, only: [:show]

def enqueue_reddit_page_visit_event
  return unless @document
  return unless @document.space&.home_document_id == @document.id
  return if @document_visit_already_existed

  RedditConversionJob.perform_later(
    event_type: "PageVisit",
    user_id: current_user.id,
    ip_address: request.remote_ip,
    user_agent: request.user_agent
  )
end
```

**Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/requests/documents_reddit_page_visit_spec.rb`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add app/controllers/documents_controller.rb spec/requests/documents_reddit_page_visit_spec.rb
git commit -m "feat: enqueue Reddit PAGE_VISIT on first space home document visit"
```

---

### Task 7: Run full test suite and verify

**Step 1: Run existing specs to check for regressions**

Run: `bin/rspec`
Expected: All existing tests still pass

**Step 2: Run the new specs specifically**

Run: `bin/rspec spec/services/reddit_conversion_service_spec.rb spec/jobs/reddit_conversion_job_spec.rb spec/requests/registrations_spec.rb spec/requests/documents_reddit_page_visit_spec.rb`
Expected: All new tests PASS

**Step 3: Fix any failures**

If any tests fail, investigate and fix before proceeding.

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address test failures from Reddit CAPI integration"
```

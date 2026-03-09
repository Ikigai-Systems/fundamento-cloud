# Reddit Conversion API (CAPI) Integration Design

## Problem

Reddit Ads tracking relies on a client-side pixel that gets blocked by ad blockers and privacy-focused browsers. This means conversion events (sign-ups, onboarding completions) are underreported, reducing campaign optimization effectiveness.

## Solution

Add server-side Reddit Conversion API (v3) integration that fires alongside the existing client-side pixel. Reddit deduplicates events using `conversion_id`, so both can coexist.

## Events

1. **SIGN_UP** - Fires when a new user registers
2. **PAGE_VISIT** - Fires on the first visit to the user's auto-created space (onboarding completion signal)

## Data Flow

```
User clicks Reddit Ad -> lands on Fundamento with `rdt_cid` cookie
  -> Signs up -> registration form captures `rdt_cid` as hidden field
  -> User created with `reddit_click_id` column
  -> RedditConversionJob enqueued: SIGN_UP event

User visits auto-created space home page (first time)
  -> ObjectVisitor tracks the visit
  -> RedditConversionJob enqueued: PAGE_VISIT event
```

## Components

### 1. Database: Add `reddit_click_id` to users

Migration adds a nullable string column to `users` table.

### 2. Frontend: Capture `rdt_cid` cookie at registration

Small JS snippet in the registration form reads the `rdt_cid` cookie and populates a hidden field. The registrations controller permits and saves it.

### 3. `RedditConversionService`

`app/services/reddit_conversion_service.rb`

- Wraps the Reddit CAPI v3 HTTP call
- Endpoint: `POST https://ads-api.reddit.com/api/v3/conversions/events/{pixel_id}`
- Auth: `Authorization: Bearer <conversion_access_token>`
- Hashes email with SHA256 (lowercase) before sending
- Sends: event_type, event_at, click_id, hashed email, IP, user agent, conversion_id
- **No-op when credentials are missing** (pixel_id or conversion_access_token not configured)

### 4. `RedditConversionJob`

`app/jobs/reddit_conversion_job.rb`

- Accepts: event_type, user_id, IP, user_agent, metadata
- `before_enqueue` callback checks `RedditConversionService.enabled?`; aborts enqueue if credentials missing
- Job never enters the queue when disabled — no wasted work, no noise
- Loads user, calls `RedditConversionService`
- Retries on transient failures (network errors, 5xx responses)

### 5. Hook Points

**RegistrationsController#create** - After successful sign-up, enqueue SIGN_UP event with user's IP and user agent.

**SpacesController#show** (or equivalent) - After `track_object_visit`, check if this is the first visit to the user's auto-created space. If so, enqueue PAGE_VISIT event.

### 6. Graceful Degradation

The entire feature is **silently disabled** when Reddit credentials are not set:
- Standalone mode: no credentials configured, no jobs enqueued
- Non-advertising periods: remove credentials to disable, no code changes needed
- No error logs, no failed jobs, just skipped

## API Request Format

```json
POST https://ads-api.reddit.com/api/v3/conversions/events/{pixel_id}
Authorization: Bearer {conversion_access_token}
Content-Type: application/json

{
  "events": [
    {
      "event_at": "2026-03-09T12:00:00Z",
      "event_type": {
        "tracking_type": "SignUp"
      },
      "click_id": "rdt_cid_value",
      "user": {
        "email": "sha256_hashed_lowercase_email",
        "ip_address": "1.2.3.4",
        "user_agent": "Mozilla/5.0..."
      },
      "event_metadata": {
        "conversion_id": "unique_dedupe_id"
      }
    }
  ]
}
```

## Credentials

Stored in Rails encrypted credentials alongside existing Reddit config:

```yaml
reddit:
  pixel_id: "existing_pixel_id"
  conversion_access_token: "token_from_reddit_ads_manager"
```

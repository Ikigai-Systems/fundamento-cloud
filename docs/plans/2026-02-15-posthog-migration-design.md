# PostHog Migration Design

## Goal

Migrate fundamento-cloud from Plausible + Google Tag Manager to PostHog, matching the same PostHog project used by fundamento-website. Add cookie consent banner, Twitter pixel, and Reddit pixel. Enable cross-domain tracking between fundamento.it and fundamento.cloud.

## Constraints

- All tracking disabled in standalone mode (`Flipper.enabled?(:standalone)`)
- Rails/Hotwire/Stimulus stack (no React components)
- Graceful degradation when any pixel ID is not configured
- Step-by-step migration: add PostHog first, then pixels, then remove GTM/Plausible last

## Architecture

### PostHog Initialization

PostHog JS loaded via npm, initialized in `application.js` alongside Sentry. Configuration matches the website:

- `api_host: "/ingest"` (proxied through Rails)
- `ui_host: "https://eu.posthog.com"`
- `cookieless_mode: "on_reject"`
- Manual pageview capture on `turbo:load`
- Session recording with input masking
- Autocapture enabled
- Bootstrap from URL hash params for cross-domain tracking

### Configuration

Environment variables (following existing `PLAUSIBLE_DOMAIN` pattern):

- `POSTHOG_KEY` - PostHog API key (same as website project)
- `TWITTER_PIXEL_ID` - optional
- `REDDIT_PIXEL_ID` - optional

Exposed to JS via `window.FundamentoConfig` (existing pattern).

### User Identification

After PostHog init, if user is logged in, call `posthog.identify(userNPI, { email })`. This links anonymous visitors to their accounts and connects cross-domain journeys.

`currentUserId` (NPI) and `currentUserEmail` added to `FundamentoConfig` when `current_user` is present.

### Rails Proxy

`Analytics::IngestController` with catch-all action:

- `match "/ingest/*path"` forwarding to `https://eu.i.posthog.com`
- `/ingest/static/*` forwarding to `https://eu-assets.i.posthog.com/static/*`
- Skip CSRF and authentication
- Forward request body and content-type

### Cookie Banner

Stimulus controller (`cookie_banner_controller.js`) + ERB partial (`_cookie_banner.html.erb`):

- On connect: check `posthog.get_explicit_consent_status()`, hide if not pending
- Accept: `posthog.opt_in_capturing()`, hide, dispatch `consent:changed` on document
- Decline: `posthog.opt_out_capturing()`, hide, dispatch `consent:changed` on document
- Fixed bottom banner with Accept/Decline buttons, privacy policy link
- Rendered in `_body.html.erb`, gated by standalone check

### Consent Flow

- PostHog starts in pending state (no tracking until user decides)
- Accept: full tracking with cookies
- Decline: PostHog switches to cookieless mode (anonymous, no cookies)
- Twitter/Reddit pixels only load on accept (no cookieless fallback)

### Twitter & Reddit Pixels

Stimulus controllers (`twitter_pixel_controller.js`, `reddit_pixel_controller.js`):

- On connect: check consent, listen for `consent:changed` event
- Load pixel script only when consent is granted
- Prevent double-loading with a loaded flag
- No-op if pixel ID not configured
- ERB partials rendered in `_body.html.erb`, gated by standalone check and env var presence

### Cross-Domain Tracking

**Cloud side (this project):**
- On PostHog init, parse `window.location.hash` for `distinct_id` and `session_id`
- Pass as `bootstrap: { distinctID, sessionID }` in PostHog config
- Clean hash from URL using `history.replaceState`

**Website side (fundamento-website):**
- Add `buildCrossDomainUrl(url)` utility function
- Reads `posthog.get_distinct_id()` and `posthog.get_session_id()`
- Appends `#distinct_id=xxx&session_id=xxx` to the URL
- React context provides current IDs, links reactively update when available
- All CTA links to fundamento.cloud use this function

### Standalone Mode Guard

- In `_body.html.erb`: don't render PostHog config, cookie banner, or pixel partials when `Flipper.enabled?(:standalone)`
- In JS: check if config values present before initializing (graceful no-op)

## Removal Plan (Last Step)

After verifying PostHog data flows correctly in production:

**Remove Plausible:**
- Remove `plausible-tracker` from `package.json`
- Remove Plausible code from `application.js`
- Remove `PLAUSIBLE_DOMAIN` from config

**Remove GTM:**
- Remove `_google_tag_manager.html.erb` partial and render call
- Remove `google_tag_manager_id` from credentials

Separate commits for easy rollback.

## E2E Testing

Cookie banner covered by Cypress E2E test:
- Verify banner appears for new visitors
- Verify accept hides banner and enables tracking
- Verify decline hides banner
- Verify banner doesn't reappear after decision
- Verify banner doesn't appear in standalone mode

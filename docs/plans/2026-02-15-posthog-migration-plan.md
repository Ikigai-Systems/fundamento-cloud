# PostHog Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate fundamento-cloud from Plausible + GTM to PostHog with cookie consent, ad pixels, and cross-domain tracking.

**Architecture:** PostHog JS initialized in the Vite entrypoint, proxied through a Rails controller at `/ingest`. Cookie banner and ad pixels are Stimulus controllers with ERB partials. All tracking gated by `Flipper.enabled?(:standalone)`. See `docs/plans/2026-02-15-posthog-migration-design.md` for full design.

**Tech Stack:** PostHog JS (posthog-js), Rails 8.1, Stimulus, Cypress, Vite

---

### Task 1: Install posthog-js and add Rails proxy

**Files:**
- Modify: `package.json`
- Create: `app/controllers/analytics/ingest_controller.rb`
- Modify: `config/routes.rb`

**Step 1: Install posthog-js**

Run: `npm install posthog-js`

**Step 2: Create the ingest proxy controller**

Create `app/controllers/analytics/ingest_controller.rb`:

```ruby
class Analytics::IngestController < ActionController::Base
  skip_forgery_protection

  def proxy
    target_host = if request.path.start_with?("/ingest/static/")
      "https://eu-assets.i.posthog.com"
    else
      "https://eu.i.posthog.com"
    end

    path = request.path.sub(%r{^/ingest}, "")
    target_url = "#{target_host}#{path}"
    target_url += "?#{request.query_string}" if request.query_string.present?

    response = Net::HTTP.post(
      URI(target_url),
      request.raw_post,
      "Content-Type" => request.content_type
    )

    render body: response.body, status: response.code.to_i, content_type: response["Content-Type"]
  end
end
```

**Step 3: Add the ingest route**

In `config/routes.rb`, add before the `root` line:

```ruby
# PostHog analytics proxy
match "/ingest/*path", to: "analytics/ingest#proxy", via: [:get, :post]
```

**Step 4: Verify proxy controller loads**

Run: `bundle exec rspec --dry-run` (just confirm no load errors)

**Step 5: Commit**

```bash
git add package.json package-lock.json app/controllers/analytics/ingest_controller.rb config/routes.rb
git commit -m "feat: add posthog-js and Rails ingest proxy for analytics"
```

---

### Task 2: Initialize PostHog in the frontend

**Files:**
- Modify: `app/views/layouts/_body.html.erb:41-46` (FundamentoConfig)
- Modify: `app/javascript/entrypoints/application.js`

**Step 1: Extend FundamentoConfig with PostHog key and user info**

In `app/views/layouts/_body.html.erb`, replace the FundamentoConfig script block (lines 41-47) with:

```erb
  <script>
    window.FundamentoConfig = {
      sentryDsn: <%= Rails.application.credentials.dig(:sentry, :frontend_dsn).to_json.html_safe %>,
      replaysSessionSampleRate: <%= replays_session_sample_rate %>,
      plausibleDomain: <%= ENV["PLAUSIBLE_DOMAIN"].to_json.html_safe %>,
      <% unless Flipper.enabled?(:standalone) %>
        posthogKey: <%= ENV["POSTHOG_KEY"].to_json.html_safe %>,
        <% if current_user.present? %>
          currentUserId: <%= current_user.id.to_json.html_safe %>,
          currentUserEmail: <%= current_user.email.to_json.html_safe %>,
        <% end %>
      <% end %>
    };
  </script>
```

**Step 2: Add PostHog initialization in application.js**

Add after the existing Sentry init block (after line 49) in `app/javascript/entrypoints/application.js`:

```javascript
import posthog from "posthog-js";

if (window.FundamentoConfig.posthogKey) {
  // Parse cross-domain bootstrap params from URL hash
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const bootstrapDistinctId = hashParams.get("distinct_id");
  const bootstrapSessionId = hashParams.get("session_id");

  const posthogConfig = {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "always",
    cookieless_mode: "on_reject",
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    autocapture: {
      dom_event_allowlist: ["click", "change", "submit"],
      url_allowlist: [window.location.origin],
      element_allowlist: ["a", "button", "form", "input", "select", "textarea"],
      css_selector_allowlist: ["[ph-autocapture]"],
    },
    capture_exceptions: true,
    capture_performance: true,
  };

  if (bootstrapDistinctId || bootstrapSessionId) {
    posthogConfig.bootstrap = {};
    if (bootstrapDistinctId) posthogConfig.bootstrap.distinctID = bootstrapDistinctId;
    if (bootstrapSessionId) posthogConfig.bootstrap.sessionID = bootstrapSessionId;
  }

  posthog.init(window.FundamentoConfig.posthogKey, posthogConfig);

  // Clean hash params from URL
  if (bootstrapDistinctId || bootstrapSessionId) {
    hashParams.delete("distinct_id");
    hashParams.delete("session_id");
    const remainingHash = hashParams.toString();
    const newUrl = window.location.pathname + window.location.search + (remainingHash ? "#" + remainingHash : "");
    history.replaceState(null, "", newUrl);
  }

  // Identify logged-in user
  if (window.FundamentoConfig.currentUserId) {
    posthog.identify(window.FundamentoConfig.currentUserId, {
      email: window.FundamentoConfig.currentUserEmail,
    });
  }

  // Track pageviews on Turbo navigation
  document.addEventListener("turbo:load", () => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  });
}

window.posthog = posthog;
```

**Step 3: Add POSTHOG_KEY to .env files**

Add to `.env` (or `.env.development` if it exists):

```
POSTHOG_KEY=phc_vZ0pm9Xih5nIxEupT2irkfF2PT8GsXoLvaQ5Mh1z0T2
```

Note: Use the same key from fundamento-website's `.env.sample`.

**Step 4: Verify PostHog loads in development**

Run: `bin/dev`, open `http://localhost:3000`, check browser console for PostHog initialization (no errors), check Network tab for requests to `/ingest`.

**Step 5: Commit**

```bash
git add app/views/layouts/_body.html.erb app/javascript/entrypoints/application.js
git commit -m "feat: initialize PostHog with user identification and cross-domain bootstrap"
```

---

### Task 3: Cookie banner Stimulus controller and partial

**Files:**
- Create: `app/javascript/stimulus/cookie_banner_controller.js`
- Create: `app/views/layouts/_cookie_banner.html.erb`
- Modify: `app/javascript/stimulus/index.js`
- Modify: `app/views/layouts/_body.html.erb`

**Step 1: Create the Stimulus controller**

Create `app/javascript/stimulus/cookie_banner_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    if (!window.posthog || !window.FundamentoConfig.posthogKey) {
      this.element.style.display = "none";
      return;
    }

    const status = window.posthog.get_explicit_consent_status();
    if (status !== "pending") {
      this.element.style.display = "none";
    }
  }

  accept() {
    window.posthog.opt_in_capturing();
    this.element.style.display = "none";
    document.dispatchEvent(new CustomEvent("consent:changed", { detail: { status: "granted" } }));
  }

  decline() {
    window.posthog.opt_out_capturing();
    this.element.style.display = "none";
    document.dispatchEvent(new CustomEvent("consent:changed", { detail: { status: "denied" } }));
  }
}
```

**Step 2: Register the controller in stimulus/index.js**

Add import and registration in `app/javascript/stimulus/index.js`:

```javascript
import CookieBannerController from "./cookie_banner_controller.js";
```

And register:

```javascript
application.register("cookie-banner", CookieBannerController);
```

**Step 3: Create the ERB partial**

Create `app/views/layouts/_cookie_banner.html.erb`:

```erb
<div data-controller="cookie-banner" class="fixed inset-x-0 bottom-0 z-50 p-4">
  <div class="mx-auto max-w-xl rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
    <p class="text-sm text-zinc-600 dark:text-zinc-400">
      We use cookies to understand how you use our app and to improve your
      experience. This includes analytics and session recording.
      <a href="https://fundamento.it/privacy-policy"
         target="_blank"
         class="text-blue-600 underline hover:no-underline dark:text-blue-400">
        Privacy policy
      </a>
    </p>
    <div class="mt-3 flex gap-3">
      <button type="button"
              data-action="cookie-banner#accept"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
        Accept
      </button>
      <button type="button"
              data-action="cookie-banner#decline"
              class="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600">
        Decline
      </button>
    </div>
  </div>
</div>
```

**Step 4: Render the cookie banner in _body.html.erb**

Add before the closing `<% end %>` tag (before line 84), after the livechat block:

```erb
  <% unless Flipper.enabled?(:standalone) %>
    <%= render partial: "layouts/cookie_banner" %>
  <% end %>
```

**Step 5: Verify in browser**

Run: `bin/dev`, visit the app. Cookie banner should appear at the bottom. Click Accept - banner should disappear. Reload - banner should not reappear.

**Step 6: Commit**

```bash
git add app/javascript/stimulus/cookie_banner_controller.js app/javascript/stimulus/index.js app/views/layouts/_cookie_banner.html.erb app/views/layouts/_body.html.erb
git commit -m "feat: add cookie consent banner with Stimulus controller"
```

---

### Task 4: Twitter pixel Stimulus controller

**Files:**
- Create: `app/javascript/stimulus/twitter_pixel_controller.js`
- Create: `app/views/layouts/_twitter_pixel.html.erb`
- Modify: `app/javascript/stimulus/index.js`
- Modify: `app/views/layouts/_body.html.erb:41-47` (add to FundamentoConfig)

**Step 1: Add TWITTER_PIXEL_ID to FundamentoConfig**

In the `<% unless Flipper.enabled?(:standalone) %>` block in `_body.html.erb`, add:

```erb
        twitterPixelId: <%= ENV["TWITTER_PIXEL_ID"].to_json.html_safe %>,
```

**Step 2: Create the Stimulus controller**

Create `app/javascript/stimulus/twitter_pixel_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { id: String }

  connect() {
    if (!this.idValue || !window.posthog) return;

    this.loaded = false;
    this.boundOnConsentChange = this.onConsentChange.bind(this);
    document.addEventListener("consent:changed", this.boundOnConsentChange);

    this.checkConsentAndLoad();
  }

  disconnect() {
    if (this.boundOnConsentChange) {
      document.removeEventListener("consent:changed", this.boundOnConsentChange);
    }
  }

  onConsentChange() {
    this.checkConsentAndLoad();
  }

  checkConsentAndLoad() {
    if (this.loaded) return;
    if (!window.posthog || window.posthog.get_explicit_consent_status() !== "granted") return;

    this.loaded = true;
    this.loadPixel();
  }

  loadPixel() {
    !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');

    twq('config', this.idValue);
  }
}
```

**Step 3: Create the ERB partial**

Create `app/views/layouts/_twitter_pixel.html.erb`:

```erb
<div data-controller="twitter-pixel"
     data-twitter-pixel-id-value="<%= ENV["TWITTER_PIXEL_ID"] %>"
     style="display:none">
</div>
```

**Step 4: Register controller and render partial**

In `app/javascript/stimulus/index.js`, add:

```javascript
import TwitterPixelController from "./twitter_pixel_controller.js";
```

```javascript
application.register("twitter-pixel", TwitterPixelController);
```

In `app/views/layouts/_body.html.erb`, inside the `<% unless Flipper.enabled?(:standalone) %>` block, add:

```erb
    <% if ENV["TWITTER_PIXEL_ID"].present? %>
      <%= render partial: "layouts/twitter_pixel" %>
    <% end %>
```

**Step 5: Commit**

```bash
git add app/javascript/stimulus/twitter_pixel_controller.js app/javascript/stimulus/index.js app/views/layouts/_twitter_pixel.html.erb app/views/layouts/_body.html.erb
git commit -m "feat: add Twitter pixel with consent-gated loading"
```

---

### Task 5: Reddit pixel Stimulus controller

**Files:**
- Create: `app/javascript/stimulus/reddit_pixel_controller.js`
- Create: `app/views/layouts/_reddit_pixel.html.erb`
- Modify: `app/javascript/stimulus/index.js`
- Modify: `app/views/layouts/_body.html.erb` (add to FundamentoConfig)

**Step 1: Add REDDIT_PIXEL_ID to FundamentoConfig**

In the `<% unless Flipper.enabled?(:standalone) %>` block in `_body.html.erb`, add:

```erb
        redditPixelId: <%= ENV["REDDIT_PIXEL_ID"].to_json.html_safe %>,
```

**Step 2: Create the Stimulus controller**

Create `app/javascript/stimulus/reddit_pixel_controller.js`:

```javascript
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { id: String }

  connect() {
    if (!this.idValue || !window.posthog) return;

    this.loaded = false;
    this.boundOnConsentChange = this.onConsentChange.bind(this);
    document.addEventListener("consent:changed", this.boundOnConsentChange);

    this.checkConsentAndLoad();
  }

  disconnect() {
    if (this.boundOnConsentChange) {
      document.removeEventListener("consent:changed", this.boundOnConsentChange);
    }
  }

  onConsentChange() {
    this.checkConsentAndLoad();
  }

  checkConsentAndLoad() {
    if (this.loaded) return;
    if (!window.posthog || window.posthog.get_explicit_consent_status() !== "granted") return;

    this.loaded = true;
    this.loadPixel();
  }

  loadPixel() {
    !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);

    rdt('init', this.idValue, { optOut: false, useDecimalCurrencyValues: true });
    rdt('track', 'PageVisit');
  }
}
```

**Step 3: Create the ERB partial**

Create `app/views/layouts/_reddit_pixel.html.erb`:

```erb
<div data-controller="reddit-pixel"
     data-reddit-pixel-id-value="<%= ENV["REDDIT_PIXEL_ID"] %>"
     style="display:none">
</div>
```

**Step 4: Register controller and render partial**

In `app/javascript/stimulus/index.js`, add:

```javascript
import RedditPixelController from "./reddit_pixel_controller.js";
```

```javascript
application.register("reddit-pixel", RedditPixelController);
```

In `app/views/layouts/_body.html.erb`, inside the `<% unless Flipper.enabled?(:standalone) %>` block, add:

```erb
    <% if ENV["REDDIT_PIXEL_ID"].present? %>
      <%= render partial: "layouts/reddit_pixel" %>
    <% end %>
```

**Step 5: Commit**

```bash
git add app/javascript/stimulus/reddit_pixel_controller.js app/javascript/stimulus/index.js app/views/layouts/_reddit_pixel.html.erb app/views/layouts/_body.html.erb
git commit -m "feat: add Reddit pixel with consent-gated loading"
```

---

### Task 6: Cookie banner E2E test

**Files:**
- Create: `spec/e2e/cypress/e2e/cookie-banner/cookie-banner.cy.js`

**Step 1: Write the E2E test**

Create `spec/e2e/cypress/e2e/cookie-banner/cookie-banner.cy.js`:

```javascript
describe("Cookie Banner", () => {
  context("Cloud mode (non-standalone)", () => {
    beforeEach(() => {
      cy.app("clean");
      cy.appFlipper({ flags: [] });
      cy.appFactories([
        ["create", "user", {
          email: "test@example.com",
          password: "Password123!",
          confirmed_at: new Date().toISOString(),
        }],
      ]);
    });

    it("shows cookie banner on first visit", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-test");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("We use cookies").should("be.visible");
      cy.contains("Accept").should("be.visible");
      cy.contains("Decline").should("be.visible");
    });

    it("hides banner after accepting", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-accept");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Accept").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("hides banner after declining", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-decline");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Decline").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("does not show banner again after accepting", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-persist");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Accept").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");

      // Revisit
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("does not show banner again after declining", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-persist-decline");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Decline").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");

      // Revisit
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("links to privacy policy", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-privacy");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']")
        .find("a[href='https://fundamento.it/privacy-policy']")
        .should("exist")
        .should("have.attr", "target", "_blank");
    });
  });

  context("Standalone mode", () => {
    beforeEach(() => {
      cy.app("clean");
      cy.appFlipper({ flags: ["standalone"] });
      cy.appFactories([
        ["create", "user", {
          email: "standalone@example.com",
          password: "Password123!",
          confirmed_at: new Date().toISOString(),
        }],
      ]);
    });

    it("does not show cookie banner", () => {
      cy.loginWithSession("standalone@example.com", "Password123!", "standalone-cookie");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("not.exist");
    });
  });
});
```

**Step 2: Run the E2E test**

Run: `docker compose -p e2e-tests down && bin/dev-e2e --build && npx cypress run --project spec/e2e --spec "cypress/e2e/cookie-banner/cookie-banner.cy.js"`

Fix any failures.

**Step 3: Commit**

```bash
git add spec/e2e/cypress/e2e/cookie-banner/cookie-banner.cy.js
git commit -m "test: add E2E tests for cookie consent banner"
```

---

### Task 7: Cross-domain tracking (website side)

**Files:**
- Create: `src/lib/crossDomainUrl.js` in fundamento-website
- Modify: CTA link components in fundamento-website that link to fundamento.cloud

**Step 1: Create the utility function**

Create `/Users/pawel/Development/Ikigai-Systems/fundamento-website/src/lib/crossDomainUrl.js`:

```javascript
import posthog from "posthog-js";

/**
 * Build a URL to fundamento.cloud with PostHog cross-domain tracking params.
 * Appends distinct_id and session_id as hash params so the cloud app
 * can bootstrap PostHog with the same identity.
 *
 * @param {string} url - The target URL (e.g. "https://fundamento.cloud/register")
 * @returns {string} The URL with PostHog IDs appended as hash params
 */
export function buildCrossDomainUrl(url) {
  try {
    const distinctId = posthog.get_distinct_id();
    const sessionId = posthog.get_session_id();

    if (!distinctId && !sessionId) return url;

    const parsed = new URL(url);
    const hashParams = new URLSearchParams(parsed.hash.substring(1));
    if (distinctId) hashParams.set("distinct_id", distinctId);
    if (sessionId) hashParams.set("session_id", sessionId);
    parsed.hash = hashParams.toString();

    return parsed.toString();
  } catch {
    return url;
  }
}
```

**Step 2: Update CTA links to use buildCrossDomainUrl**

Search fundamento-website for links to `fundamento.cloud` and wrap them with `buildCrossDomainUrl()`. The exact components will vary - search for `fundamento.cloud` in the codebase and update each link.

Example pattern:
```jsx
import { buildCrossDomainUrl } from '@/lib/crossDomainUrl'

// Before:
<a href="https://fundamento.cloud/users/sign_up">Sign Up</a>

// After:
<a href={buildCrossDomainUrl("https://fundamento.cloud/users/sign_up")}>Sign Up</a>
```

**Step 3: Commit (in fundamento-website)**

```bash
cd /Users/pawel/Development/Ikigai-Systems/fundamento-website
git add src/lib/crossDomainUrl.js
git commit -m "feat: add cross-domain URL builder for PostHog tracking to fundamento.cloud"
```

---

### Task 8: Remove Plausible

**Files:**
- Modify: `package.json` (remove plausible-tracker)
- Modify: `app/javascript/entrypoints/application.js` (remove Plausible code)
- Modify: `app/views/layouts/_body.html.erb` (remove plausibleDomain from FundamentoConfig)

**Step 1: Remove plausible-tracker package**

Run: `npm uninstall plausible-tracker`

**Step 2: Remove Plausible code from application.js**

Remove lines 51-67 from `app/javascript/entrypoints/application.js` (the Plausible import, dummy function, and initialization block).

**Step 3: Remove plausibleDomain from FundamentoConfig**

In `app/views/layouts/_body.html.erb`, remove the line:

```erb
      plausibleDomain: <%= ENV["PLAUSIBLE_DOMAIN"].to_json.html_safe %>,
```

**Step 4: Verify the app still loads**

Run: `bin/dev`, visit `http://localhost:3000`, confirm no JS errors in console.

**Step 5: Commit**

```bash
git add package.json package-lock.json app/javascript/entrypoints/application.js app/views/layouts/_body.html.erb
git commit -m "chore: remove Plausible analytics (replaced by PostHog)"
```

---

### Task 9: Remove Google Tag Manager

**Files:**
- Delete: `app/views/layouts/_google_tag_manager.html.erb`
- Modify: `app/views/layouts/_body.html.erb` (remove GTM render block)

**Step 1: Remove the GTM partial render from _body.html.erb**

Remove lines 26-28 from `app/views/layouts/_body.html.erb`:

```erb
  <% if Rails.application.credentials.google_tag_manager_id.present? %>
    <%= render partial: "layouts/google_tag_manager", locals: { gtm_id: Rails.application.credentials.google_tag_manager_id } %>
  <% end %>
```

**Step 2: Delete the GTM partial**

Run: `command rm app/views/layouts/_google_tag_manager.html.erb`

**Step 3: Verify the app still loads**

Run: `bin/dev`, visit `http://localhost:3000`, confirm no errors.

**Step 4: Commit**

```bash
git add app/views/layouts/_body.html.erb
git rm app/views/layouts/_google_tag_manager.html.erb
git commit -m "chore: remove Google Tag Manager (replaced by PostHog)"
```

---

### Task 10: Final cleanup and verification

**Step 1: Run the full test suite**

Run: `bundle exec rspec`

Fix any failures.

**Step 2: Run E2E tests**

Run: `docker compose -p e2e-tests down && bin/dev-e2e --build && npx cypress run --project spec/e2e`

Fix any failures.

**Step 3: Run JS lint**

Run: `npm run lint`

Fix any issues.

**Step 4: Manual smoke test**

1. Visit the app in development
2. Verify cookie banner appears
3. Accept cookies, verify PostHog events in Network tab (`/ingest` requests)
4. Check PostHog dashboard for incoming events
5. Verify no GTM or Plausible requests in Network tab

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: final cleanup after PostHog migration"
```

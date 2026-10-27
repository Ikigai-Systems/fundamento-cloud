import { isOrganizationCookie } from "../../support/organization-cookies.js"
import { deviceName } from "../../support/device.js"

// Visits every page a signed-in user can reach and runs `cy.checkPageHealth()` on it, with
// each sidebar drawer open in turn where the page has one. It runs only when asked for, on any
// device profile; CI's phone and landscape-tablet jobs ask, so a page that regresses on touch
// fails the build:
//
//   npx cypress run --project spec/e2e --expose device=phone,crawl=true --spec "**/devices/crawl.cy.js"
//
// Each failing page is a failing test with a screenshot, and the run writes every page's
// problems to tmp/crawl-<device>.md.
//
// The page list is kept complete by the route check below, which runs on every profile, crawl
// or not: each GET route must be either crawled (PAGES) or skipped with a reason (NOT_PAGES).

// Route → the page visited for it. `:team` is filled in from the fixtures, whose team ids are
// integers.
const PAGES = {
  "/": "/",
  "/notifications": "/notifications",
  "/recently_updated": "/recently_updated",
  "/shared": "/shared",
  "/s": "/s",
  "/s/new": "/s/new",
  "/s/:id": "/s/is_default",
  "/s/:id/edit": "/s/is_default/edit",
  "/s/:space_id/automations": "/s/is_default/automations",
  "/s/:space_id/automations/new": "/s/is_default/automations/new",
  "/s/:space_id/automations/:id": "/s/is_default/automations/iswebhook1",
  "/s/:space_id/automations/:id/edit": "/s/is_default/automations/iswebhook1/edit",
  "/d/:id/edit": "/d/one/edit",
  "/d/:document_id/versions": "/d/two/versions",
  "/d/:document_id/versions/:id": "/d/two/versions/latest",
  "/t/:id": "/t/projects",
  "/t/:id/edit": "/t/projects/edit",
  "/t/:table_id/versions": "/t/projects/versions",
  "/public/:id": "/public/r2fPRJxuTX",
  "/public_links": "/public_links",
  "/import_sessions": "/import_sessions",
  "/import_sessions/new": "/import_sessions/new",
  "/import_sessions/:id": "/import_sessions/issession01",
  "/organizations": "/organizations",
  "/organizations/new": "/organizations/new",
  "/organizations/:id": "/organizations/is",
  "/organizations/:id/edit": "/organizations/is/edit",
  "/teams": "/teams",
  "/teams/new": "/teams/new",
  "/teams/:id": "/teams/:team",
  "/teams/:id/edit": "/teams/:team/edit",
  "/integrations/ai-assistants": "/integrations/ai-assistants",
  "/users/edit": "/users/edit",
  "/users/invitation/new": "/users/invitation/new",
  "/users/confirmation/pending": "/users/confirmation/pending",
  "/oauth/authorized_applications": "/oauth/authorized_applications",
  "/oauth/pick-organization": "/oauth/pick-organization",
}

// Pages for a signed-out visitor
const SIGNED_OUT_PAGES = {
  "/users/sign_in": "/users/sign_in",
  "/users/sign_up": "/users/sign_up",
  "/users/password/new": "/users/password/new",
  "/users/confirmation/new": "/users/confirmation/new",
  "/invited_users/sign_in": "/invited_users/sign_in",
}

const reasons = (reason, routes) => Object.fromEntries(routes.map((route) => [route, reason]))

const NOT_PAGES = {
  ...reasons("redirects to a page crawled under another route", [
    "/d/:id", "/spaces/:space_id/documents/:id", "/spaces/:space_id/documents/:id/edit",
    "/spaces/:space_id/tables/:id", "/spaces/:space_id/tables/:id/edit", "/oauth/authorize",
    "/public_links/:id", "/users/:user_id/avatar/edit", "/integrations/api-tokens/new",
    "/integrations", "/mcp", "/users/:user_id/api_tokens",
    "/organization_memberships/:id/change_password",
  ]),
  ...reasons("loaded into a page, not visited on its own", [
    "/d/:id/sidebar", "/d/:id/hierarchy", "/d/:id/select_destination", "/s/:id/sidebar",
    "/t/:id/sidebar", "/favorites", "/mentions", "/inline_comments/threads/:thread_id",
  ]),
  ...reasons("JSON for the page's scripts", [
    "/d", "/t", "/search", "/users", "/users/:id", "/s/suggest_owners",
    "/teams/suggest_members", "/s/:space_id/tags/suggest", "/d/:document_id/object_references",
    "/t/:table_id/columns", "/t/:table_id/rows", "/t/:table_id/rows/:row_id/cells", "/version",
    "/oauth/token/info", "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/api/mcp/organizations/:organization_id", "/up",
  ]),
  ...reasons("declared by `resources` but has no page", [
    "/comments", "/comments/new", "/comments/:id", "/comments/:id/edit", "/reactions",
    "/reactions/:id", "/d/new", "/t/new", "/d/:document_id/tags", "/t/:table_id/tags",
    "/t/:table_id/columns/new", "/t/:table_id/columns/:id", "/t/:table_id/columns/:id/edit",
    "/t/:table_id/rows/new", "/t/:table_id/rows/:id", "/t/:table_id/rows/:id/edit",
    "/t/:table_id/rows/:row_id/cells/new", "/t/:table_id/rows/:row_id/cells/:id",
    "/t/:table_id/rows/:row_id/cells/:id/edit", "/public_links/new", "/public_links/:id/edit",
  ]),
  ...reasons("acts on the request, a file or a callback rather than showing a page", [
    "/users/cancel", "/superintendent/cancel", "/users/invitation/remove",
    "/invited_users/invitation/remove", "/users/magic_link", "/users/confirmation",
    "/superintendent/confirmation", "/superintendent/unlock", "/attachments/:id",
    "/public/attachments/:id", "/onboarding_contents/*path", "/ingest/*path",
    "/users/auth/google_oauth2/callback", "/oauth/authorize/native",
  ]),
  ...reasons("Turbo Native's navigation, for the mobile apps", [
    "/recede_historical_location", "/resume_historical_location", "/refresh_historical_location",
  ]),
  ...reasons("needs a token from an email", [
    "/users/password/edit", "/superintendent/password/edit", "/users/invitation/accept",
    "/invited_users/invitation/accept", "/invited_users/invitation/new",
  ]),
  ...reasons("the superintendent's copies of the user's account pages", [
    "/superintendent/sign_in", "/superintendent/sign_up", "/superintendent/edit",
    "/superintendent/password/new", "/superintendent/confirmation/new", "/superintendent/unlock/new",
  ]),
  // Visited as a page, so it belongs in PAGES once it renders in the E2E environment
  "/integrations/api-tokens": "fails in the E2E environment, which has no Active Record encryption key",
  "/t/:table_id/versions/:id": "the fixtures have no table version, so it redirects to the list",
  "/organization_memberships/new": "forbidden to the crawling user, who doesn't manage the organization",
}

const ROUTES_SCRIPT = `
  Rails.application.routes.routes
    .select { |route| route.verb.include?("GET") }
    .map { |route| route.path.spec.to_s.delete_suffix("(.:format)") }
    .reject { |path| path.match?(%r{\\A/(rails|api|cable|vite|good_job|flipper|letter_opener)(/|\\z)}) }
    .uniq
`

const FIXTURES = [
  "organizations", "users", "organization_memberships", "spaces", "space_memberships",
  "documents", "versions", "teams", "team_memberships", "automations", "public_links",
  "import_sessions", "tables/tables", "tables/columns", "tables/rows", "tables/cells",
]

const crawling = () => Cypress.expose("crawl") === true || Cypress.expose("crawl") === "true"

describe("Page crawl", function () {
  it("crawls or skips every GET route", () => {
    cy.appEval(ROUTES_SCRIPT).then((routes) => {
      const known = { ...PAGES, ...SIGNED_OUT_PAGES, ...NOT_PAGES }
      const unknown = routes.filter((route) => !(route in known))
      const gone = Object.keys(known).filter((route) => !routes.includes(route))
      expect(unknown, "routes neither crawled nor skipped: add each to PAGES or NOT_PAGES in crawl.cy.js").to.deep.equal([])
      expect(gone, "routes listed in crawl.cy.js that no longer exist").to.deep.equal([])
    })
  })

  describe("pages", function () {
    const problems = []
    let team

    before(function () {
      if (!crawling()) this.skip()
      cy.app("clean")
      cy.appFixtures({ fixtures_dir: "spec/fixtures", fixtures: FIXTURES })
      cy.appEval(`Team.find_by!(name: "Engineering").id`).then((id) => { team = id })
    })

    afterEach(function () {
      if (this.currentTest.state === "failed") problems.push(`## ${this.currentTest.title}\n\n${this.currentTest.err.message}`)
    })

    after(function () {
      if (!crawling()) return
      const summary = problems.length ? problems.join("\n\n") : "No problems found."
      cy.writeFile(`../../tmp/crawl-${deviceName()}.md`, `# Page crawl as ${deviceName()}\n\n${summary}\n`)
    })

    // A page has settled once its frames have loaded: their requests count towards the
    // failed-request check, and their content towards the layout ones
    const visitSettled = (path) => {
      cy.visit(path, { failOnStatusCode: false })
      cy.document().its("readyState").should("eq", "complete")
      cy.get("turbo-frame[src]:not([loading=lazy]):not([complete]), turbo-frame[busy]", { log: false }).should("not.exist")
    }

    // A drawer leaves the page underneath in place, so its report repeats the page's own
    // problems; keep only the ones the drawer added, under their section headings
    const withoutRepeats = (report, pageReport) => {
      const seen = new Set(pageReport.split("\n"))
      return report
        .split(/\n(?=\S)/)
        .map((section) => {
          const [heading, ...problems] = section.split("\n")
          const added = problems.filter((problem) => !seen.has(problem))
          return added.length ? [heading, ...added].join("\n") : ""
        })
        .filter(Boolean)
        .join("\n")
    }

    // The page itself, then with each sidebar drawer open, so what's inside the drawers is
    // checked too. Every state is checked before failing, so one report has all of them.
    const checkPage = (path) => {
      const reports = []
      let pageReport = ""
      visitSettled(path)
      cy.pageHealthReport().then((report) => {
        pageReport = report
        if (report) reports.push(report)
      })

      ;["navigation", "details"].forEach((side) => {
        const id = side === "navigation" ? "space-sidebar" : "content-sidebar"
        cy.get("body", { log: false }).then(($body) => {
          if (!$body.find(`button[aria-controls='${id}']:visible`).length) return
          cy.openSidebar(side)
          cy.pageHealthReport().then((report) => {
            const added = withoutRepeats(report, pageReport)
            if (added) reports.push(`with the ${side} open:\n${added}`)
          })
          cy.realPress("Escape")
          cy.get(`button[aria-controls='${id}']`, { log: false }).should("have.attr", "aria-expanded", "false")
        })
      })

      cy.then(() => {
        if (reports.length) throw new Error(`Page health problems on ${path}\n${reports.join("\n")}`)
      })
    }

    describe("signed in", function () {
      beforeEach(() => {
        cy.loginWithSession("pawel@ikigai.systems", "password")
        cy.setCookie("organization_id", isOrganizationCookie)
      })

      Object.values(PAGES).forEach((page) => {
        it(page, () => checkPage(page.replace(":team", team)))
      })
    })

    describe("signed out", function () {
      Object.values(SIGNED_OUT_PAGES).forEach((page) => {
        it(page, () => checkPage(page))
      })
    })
  })
})

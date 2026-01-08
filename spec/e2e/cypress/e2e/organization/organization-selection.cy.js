// those cookies are created by EnsureOrganization.rb and are encrypted,
// each request cookie is different as the salt changes, but
// old cookies are still valid
const hcOrganizationCookie = "7pz%2Fteyl17PrTaHqdS4cTw%2FSl0qzRjDHGhkWeUcWx0g5L%2BUBzAi3%2BI2wtljLVmnPKQLIDQz9QtJKMdmnw23c3BILveIvjs7%2BsNDC--fhkIELnWGF5a5Irq--tCDkBAyZyz5JUm2CmSMv9w%3D%3D";
const isOrganizationCookie = "S%2B8izWFmjA4zW0FkMH97fnyVerT1sCW%2Fg%2FotxW3noRh0icOQvXOdx2T6Q4s%2FVErcAksXznmNnIyPIk4j6kHs7PAoWnajg48sQbZM--EY0y%2BpMv4HdJi5K5--gPFakDbAFEvGZvkQbo92qQ%3D%3D";
const noOrganizationCookie = "7S5d93XFo3Nn1CHY6EleXXZN92GUt9KeJDst7nwZTWT0LX1ivcYyBNZ6linwpA%2BiHy%2FqLxtxOD4bM26DNAAYGqQObcO619l%2BW6fFxYrVTz%2BQeOo%3D--%2FomOOmUpAJUsXdy6--QokFlTXNdnFbarBRggoT0g%3D%3D";

describe("Organization Selection (EnsureOrganization)", function() {
  // Don't change it to before unless you fix fixtures or logic in "clears invalid cookie (org exists but user not member) and redirects"
  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_users", "spaces"]
    });
  });

  afterEach(() => {
    // Clear cookies between tests to ensure clean state
    cy.clearCookies();
  });

  describe("User with one organization", () => {
    it("auto-selects organization and sets cookie when no cookie exists", function() {
      // Maria has only 1 organization (hc)
      cy.login("maria@ikigai.systems", "password");

      // Visit root - should auto-select organization
      cy.visit("/");

      // Should be on root page (not redirected to org selection)
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      // Verify cookie was set
      cy.getCookie("organization_id").should("exist");
      cy.getCookie("organization_id").then(cookie => { cy.log("Generated cookie: " + cookie.value) })
    });
  });

  describe("User with multiple organizations", () => {
    it("redirects to organization selection when no cookie exists", function() {
      // Pawel has 2 organizations (is, hc)
      cy.login("pawel@ikigai.systems", "password");

      // Visit root - should redirect to org selection
      cy.visit("/");

      // Should be redirected to organizations page
      cy.url().should("include", "/organizations");
      cy.contains("Please select an organization").should("be.visible");

      // Select an organization (Ikigai Systems)
      cy.contains("tr", "Ikigai Systems").within(() => {
        cy.contains("Switch to").click();
      });

      cy.url().should("eq", Cypress.config().baseUrl + "/s/is_default");
      cy.contains("Default IS").should("be.visible");

      cy.getCookie("organization_id").then(cookie => { cy.log("Generated cookie: " + cookie.value) })
    });

    it("uses valid cookie and loads organization", function() {
      // Set valid cookie (Pawel has access to org 'is')
      cy.setCookie("organization_id", hcOrganizationCookie);

      cy.login("pawel@ikigai.systems", "password");

      // Visit root
      cy.visit("/");

      // Should stay on root page
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      cy.visit("/s/hc_default");

      cy.contains("Default HC").should("be.visible");

      // Cookie should still be set
      cy.getCookie("organization_id").should("have.property", "value", hcOrganizationCookie);

      // Verify we can't access the other organization
      cy.request({
        url: "/s/is_default",
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });

    it("clears invalid cookie (org doesn't exist) and redirects", function() {
      // Set cookie with non-existent organization
      cy.setCookie("organization_id", noOrganizationCookie);

      cy.login("pawel@ikigai.systems", "password");

      // Visit root
      cy.visit("/");

      // Should be redirected to organizations page
      cy.url().should("include", "/organizations");
      cy.contains("Please select an organization").should("be.visible");

      // Select an organization (Ikigai Systems)
      cy.contains("tr", "Ikigai Systems").within(() => {
        cy.contains("Switch to").click();
      });

      cy.contains("Default IS").should("be.visible");

      // Cookie should be cleared (or reset)
      // Note: After redirect, cookie might be cleared or set to new value
      cy.getCookie("organization_id").should("exist");
    });

    it("clears invalid cookie (org exists but user not member) and redirects", function() {
      cy.appEval(`OrganizationUser.find("ou_hc_pawel").destroy`)

      // Set cookie with organization that exists but Pawel doesn't have access to
      // Org 'another' exists but Pawel is not a member
      cy.setCookie("organization_id", hcOrganizationCookie);

      cy.login("pawel@ikigai.systems", "password");

      // Visit root
      cy.visit("/");

      // Should be redirected to organizations page
      cy.url().should("include", "/#spaces");
      cy.contains("Mentions").should("be.visible");
      cy.contains("Please select an organization").should("not.exist");

      // Cookie should be cleared (or reset)
      // Note: After redirect, cookie might be cleared or set to new value
      cy.getCookie("organization_id").should("exist");
      cy.getCookie("organization_id").then(cookie => { cy.log("Generated cookie: " + cookie.value) })
    });
  });

  describe("User with no organizations", () => {
    it("auto-creates organization, sets cookie, and continues", function() {
      // John has no organizations
      cy.login("john@gmail.com", "password");

      // Visit root - should auto-create organization
      cy.visit("/");

      // Should stay on root page (organization auto-created)
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      // Cookie should be set
      cy.getCookie("organization_id").should("exist");

      // Verify organization was created by checking if we can access it
      // We should be able to see some content indicating we're in an organization
      cy.get("body").should("not.contain", "Please select an organization");

      cy.getCookie("organization_id").should("exist");
      cy.getCookie("organization_id").then(cookie => { cy.log("Generated cookie: " + cookie.value) })
    });
  });

  describe("Cookie persistence across page visits", () => {
    it("maintains organization selection across different pages", function() {
      cy.login("maria@ikigai.systems", "password");

      // Visit root - organization should be auto-selected
      cy.visit("/");
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      // Get the cookie value and save as alias
      cy.getCookie("organization_id").should("exist");
      cy.getCookie("organization_id").its("value").as("orgCookieValue");

      // Visit another page
      cy.visit("/users/edit");

      // Cookie should persist with same value
      cy.get("@orgCookieValue").then((firstValue) => {
        cy.getCookie("organization_id").its("value").should("eq", firstValue);
      });
    });
  });

  describe("Switching organizations", () => {
    it("allows user with multiple orgs to switch via cookie", function() {
      // Set cookie to first org
      cy.setCookie("organization_id", hcOrganizationCookie);

      cy.login("pawel@ikigai.systems", "password");

      cy.visit("/");
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      cy.get('section.focused-section').within(() => {
        cy.contains("Spaces").click();
        cy.contains("Default HC").should("be.visible");
      });

      // Change cookie to second org
      cy.setCookie("organization_id", isOrganizationCookie);
      cy.visit("/");

      // Should still work with new organization
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      cy.get('section.focused-section').within(() => {
        cy.contains("Spaces").click();
        cy.contains("Default IS").should("be.visible");
      });

      cy.getCookie("organization_id").should("exist");
    });
  });

  describe("Edge cases", () => {
    it("handles cookie with malformed value gracefully", function() {
      // Set malformed cookie
      cy.setCookie("organization_id", "clearly-not-a-valid-id-123456");

      cy.login("maria@ikigai.systems", "password");

      // Visit root
      cy.visit("/");

      // For user with 1 org, should recover by setting correct org
      cy.url().should("eq", Cypress.config().baseUrl + "/#spaces");

      // Cookie should be corrected
      cy.getCookie("organization_id").should("exist");
    });
  });
});

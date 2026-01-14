const isOrganizationCookie = "S%2B8izWFmjA4zW0FkMH97fnyVerT1sCW%2Fg%2FotxW3noRh0icOQvXOdx2T6Q4s%2FVErcAksXznmNnIyPIk4j6kHs7PAoWnajg48sQbZM--EY0y%2BpMv4HdJi5K5--gPFakDbAFEvGZvkQbo92qQ%3D%3D";

describe("Organization Invitations (Cloud Flow)", function() {
  before(() => {
    cy.app("clean");
    // Enable cloud feature flag
    cy.appFlipper({flags: ["cloud"]});
    // Load fixtures
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_users", "spaces"]
    });
  });

  // Handle JavaScript errors from the application
  Cypress.on("uncaught:exception", (err) => {
    // Ignore "Cannot read properties of null" errors on invitation page
    // This is a known issue with some JavaScript trying to access DOM elements
    // that don't exist on the invitation acceptance page
    if (err.message.includes("Cannot read properties of null") ||
        err.message.includes("Cannot read properties of undefined")) {
      return false;
    }
    return true;
  });

  describe("Inviting existing user", () => {
    it("manager can invite existing user to their organization", function() {
      // Pawel is a manager in "is" organization, John exists but is not in "is"
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      cy.setCookie("organization_id", isOrganizationCookie);

      cy.visit("/");

      // Visit the invitation form
      cy.visit("/invited_users/invitation/new?organization_id=is");

      // Fill in the invitation form
      cy.get('input[name="invited_user[email]"]').type("john@gmail.com");
      cy.get('input[type=submit]').click();

      // Should see success message
      cy.contains("An invitation email has been sent").should("be.visible");

      // Get the invitation acceptance URL from the database
      cy.appInvitationAcceptanceUrl({email: "john@gmail.com"}).then((acceptanceUrl) => {
        cy.log("Acceptance URL: " + acceptanceUrl);

        // Clear session so we can test as invited user
        cy.clearCookies();

        // Visit the acceptance URL - existing user should see prompt to accept and sign in
        cy.visit(acceptanceUrl);

        // Existing user sees invitation message
        cy.contains("Join Ikigai Systems").should("be.visible");
        cy.contains("You already have a Fundamento account with this email address").should("be.visible");

        // Click "Accept invitation & sign in" button
        cy.contains("Accept invitation & sign in").click();

        // Should be redirected to sign-in page with confirmation message
        cy.contains("Welcome to Ikigai Systems!").should("be.visible");

        // After signing in, should be redirected to the organization's spaces (organization cookie is set)
        cy.url().should("include", "/#spaces");
        cy.contains("Favorites").should("be.visible");

        // Verify the user has access to Ikigai Systems organization
        cy.visit("/s/is_default");
        cy.contains("Default IS").should("be.visible");
      });
    });
  });

  describe("Inviting new user", () => {
    it("manager can invite new user who completes passwordless registration and accesses organization", function() {
      // Pawel is a manager in "is" organization
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session-2");

      cy.setCookie("organization_id", isOrganizationCookie);

      // Visit the invitation form
      cy.visit("/invited_users/invitation/new?organization_id=is");

      // Fill in the invitation form with a new user email
      cy.get('input[name="invited_user[email]"]').type("newuser@example.com");
      cy.get('input[type=submit]').click();

      // Should see success message
      cy.contains("An invitation email has been sent").should("be.visible");

      // Get the invitation acceptance URL from the database
      cy.appInvitationAcceptanceUrl({email: "newuser@example.com"}).then((acceptanceUrl) => {
        // Clear session so we can test as new user
        cy.clearCookies();

        // Visit the acceptance URL
        cy.visit(acceptanceUrl);

        // Should see the passwordless invitation acceptance form
        cy.url().should("include", "/invited_users/invitation/accept");
        cy.contains("You've been invited to Ikigai Systems").should("be.visible");
        cy.contains("Accept invitation & create free account").should("be.visible");

        // Verify no password or name fields (passwordless flow)
        cy.get('input[name="invited_user[password]"]').should("not.exist");
        cy.get('input[name="invited_user[first_name]"]').should("not.exist");
        cy.get('input[name="invited_user[last_name]"]').should("not.exist");

        // Accept the invitation (just click submit, no fields to fill)
        cy.get('input[type=submit]').click();

        // User should be auto-logged in and redirected to the organization
        // No confirmation needed - we skip it in the controller
        cy.url().should("include", "/#spaces");
        cy.contains("Favorites").should("be.visible");

        // Verify the user has access to Ikigai Systems organization
        cy.visit("/s/is_default");
        cy.contains("Default IS").should("be.visible");
      });
    });
  });

  describe("Edge cases", () => {
    it("prevents inviting the same user twice", function() {
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session-3");

      // Visit the invitation form
      cy.visit("/invited_users/invitation/new?organization_id=is");

      // Try to invite Stefan again (he's already in the organization from previous test)
      cy.get('input[name="invited_user[email]"]').type("stefan@ikigai.systems");
      cy.get('input[type=submit]').click();

      // Should see error message
      cy.contains("is already a member of this organization").should("be.visible");
    });

    it("non-manager cannot access invitation form", function() {
      // Maria is a member (not manager) in "hc" organization
      cy.loginWithSession("maria@ikigai.systems", "password", "maria-session");

      // Try to visit the invitation form (requires organization_id)
      cy.request({
        url: "/invited_users/invitation/new?organization_id=hc",
        failOnStatusCode: false
      }).then((response) => {
        // Should get 403 Forbidden or redirect
        expect(response.status).to.be.oneOf([403, 302]);
      });
    });
  });
});

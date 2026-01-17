const isOrganizationCookie = "S%2B8izWFmjA4zW0FkMH97fnyVerT1sCW%2Fg%2FotxW3noRh0icOQvXOdx2T6Q4s%2FVErcAksXznmNnIyPIk4j6kHs7PAoWnajg48sQbZM--EY0y%2BpMv4HdJi5K5--gPFakDbAFEvGZvkQbo92qQ%3D%3D";

describe("Organization Invitations (Cloud Flow)", function() {
  before(() => {
    cy.app("clean");
    // Enable cloud feature flag
    cy.appFlipper({flags: ["cloud"]});
    // Load fixtures
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces"]
    });
  });

  describe("Inviting existing user", () => {
    it("manager can invite existing user to their organization", function() {
      // Pawel is a manager in "is" organization, John exists but is not in "is"
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      cy.setCookie("organization_id", isOrganizationCookie);

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
        cy.getCookies().should("be.empty");

        // Visit the acceptance URL - existing user should see prompt to accept and sign in
        cy.visit(acceptanceUrl);

        // Existing user sees invitation message
        cy.contains("Accept invitation").should("be.visible");
        cy.contains("Pawel Wiadomski invited you to join Ikigai Systems").should("be.visible");
        cy.contains("You already have a Fundamento account with this email address").should("be.visible");

        // Click "Accept invitation & sign in" button
        cy.contains("Accept & sign in").click();

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
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

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
        cy.getCookies().should("be.empty");

        // Visit the acceptance URL
        cy.visit(acceptanceUrl);

        // Should see the passwordless invitation acceptance form
        cy.url().should("include", "/invited_users/invitation/accept");
        cy.contains("Pawel Wiadomski invited you to collaborate in Ikigai Systems an organization on Fundamento.").should("be.visible");
        cy.contains("Accept & create free account").should("be.visible");

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
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      // Visit the invitation form
      cy.visit("/invited_users/invitation/new?organization_id=is");

      // Try to invite Stefan again (he's already in the organization from the fixture)
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

    it("shows account mismatch when wrong user is logged in", function() {
      // Invite bob@example.com to "is" organization (doesn't exist yet)
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      cy.visit("/invited_users/invitation/new?organization_id=is");

      cy.get('input[name="invited_user[email]"]').type("bob@example.com");
      cy.get('input[type=submit]').click();

      // Wait for invitation to be created
      cy.contains("An invitation email has been sent").should("be.visible");

      // Get invitation URL
      cy.appInvitationAcceptanceUrl({email: "bob@example.com"}).then((acceptanceUrl) => {
        // Now log in as Maria (wrong user) and try to accept Bob's invitation
        cy.loginWithSession("maria@ikigai.systems", "password", "maria-session");

        // Visit Bob's invitation URL while logged in as Maria
        cy.visit(acceptanceUrl);

        // Should see account mismatch message
        cy.contains("Account Mismatch").should("be.visible");
        cy.contains("You're signed in as").should("be.visible");
        cy.contains("maria@ikigai.systems").should("be.visible");
        cy.contains("but this invitation is for").should("be.visible");
        cy.contains("bob@example.com").should("be.visible");

        // Click sign out button
        cy.get('.form-footer button[type="submit"]').contains("Sign out").click();

        // Now should see the new user invitation flow
        cy.contains("Accept invitation").should("be.visible");
        cy.contains("Accept & create free account").should("be.visible");

        // Accept the invitation as new user (passwordless flow)
        cy.get('input[type=submit]').click();

        // Should be auto-logged in and redirected to organization
        cy.url().should("include", "/#spaces");
        cy.contains("Favorites").should("be.visible");

        // Verify access to Ikigai Systems organization
        cy.visit("/s/is_default");
        cy.contains("Default IS").should("be.visible");
      });
    });

    it("allows user logged in with correct email to accept invitation", function() {
      // Invite Maria to "is" organization (she exists but isn't in "is" - she's in "hc")
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      cy.visit("/invited_users/invitation/new?organization_id=is");

      cy.get('input[name="invited_user[email]"]').type("maria@ikigai.systems");
      cy.get('input[type=submit]').click();

      // Wait for invitation to be created
      cy.contains("An invitation email has been sent").should("be.visible");

      // Get invitation URL
      cy.appInvitationAcceptanceUrl({email: "maria@ikigai.systems"}).then((acceptanceUrl) => {
        // Log in as Maria (correct user)
        cy.loginWithSession("maria@ikigai.systems", "password", "maria-session");

        // Visit Maria's invitation URL while logged in as Maria
        cy.visit(acceptanceUrl);

        // Should see ready-to-accept message
        cy.contains("Accept invitation").should("be.visible");
        cy.contains("Pawel Wiadomski invited you to join Ikigai Systems").should("be.visible");
        cy.contains("Continuing as Maria").should("be.visible");
        cy.contains("maria@ikigai.systems").should("be.visible");

        // Verify "Not you? Sign out" link is visible and functional
        cy.contains("Not you? Sign out").should("be.visible");

        // Click accept button
        cy.get('input[type=submit]').click();

        // Should be redirected to organization spaces
        cy.url().should("include", "/#spaces");
        cy.contains("Favorites").should("be.visible");

        // Verify access to Ikigai Systems organization
        cy.visit("/s/is_default");
        cy.contains("Default IS").should("be.visible");
      });
    });

    it("allows user logged in to sign out and resume the invitation flow", function() {
      cy.appEval(`OrganizationMembership.find_by(user_id: "user_maria", organization_id: "is")&.destroy!`)

      // Invite Maria to "is" organization (she exists but isn't in "is" - she's in "hc")
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      cy.visit("/invited_users/invitation/new?organization_id=is");

      cy.get('input[name="invited_user[email]"]').type("maria@ikigai.systems");
      cy.get('input[type=submit]').click();

      // Wait for invitation to be created
      cy.contains("An invitation email has been sent").should("be.visible");

      // Get invitation URL
      cy.appInvitationAcceptanceUrl({email: "maria@ikigai.systems"}).then((acceptanceUrl) => {
        // Log in as Maria (correct user)
        cy.loginWithSession("maria@ikigai.systems", "password", "maria-session");

        // Visit Maria's invitation URL while logged in as Maria
        cy.visit(acceptanceUrl);

        // Should see ready-to-accept message
        cy.contains("Accept invitation").should("be.visible");
        cy.contains("Pawel Wiadomski invited you to join Ikigai Systems").should("be.visible");
        cy.contains("Continuing as Maria").should("be.visible");
        cy.contains("maria@ikigai.systems").should("be.visible");

        // Verify "Not you? Sign out" link is visible and functional
        cy.contains("Not you? Sign out").click()

        // Should be redirected back to the invitation page
        cy.contains("Accept invitation").should("be.visible");
      });
    });

    it("shows already member message when user is already in organization", function() {
      // Invite Pawel to "is" organization (he's already a member)
      cy.loginWithSession("pawel@ikigai.systems", "password", "pawel-session");

      cy.visit("/invited_users/invitation/new?organization_id=is");

      // Create an invitation for Pawel manually via database using Devise's invite! method
      cy.app("eval", `
        org = Organization.find("is")
        InvitedUser.invite!(
          {
            email: "pawel@ikigai.systems",
            organization: org
          },
          User.find("user_pawel")
        )
      `);

      // Get invitation URL
      cy.appInvitationAcceptanceUrl({email: "pawel@ikigai.systems"}).then((acceptanceUrl) => {
        // Visit invitation URL while logged in as Pawel
        cy.visit(acceptanceUrl);

        // Should see already member message
        cy.contains("You're already a member").should("be.visible");
        cy.contains("You're already a member of").should("be.visible");
        cy.contains("Ikigai Systems").should("be.visible");

        // Click "Go to Ikigai Systems" button
        cy.contains("Go to Ikigai Systems").click();

        // Verify access to organization
        cy.visit("/s/is_default");
        cy.contains("Default IS").should("be.visible");
      });
    });
  });
});

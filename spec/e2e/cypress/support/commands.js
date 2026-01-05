// ***********************************************
// This example actions.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Login as a user with session caching
 * @param {string} email - User email (default: pawel@ikigai.systems)
 * @param {string} password - User password (default: password)
 * @param {string} sessionName - Session cache name (default: user-session)
 */
Cypress.Commands.add("loginAsUser", (email = "pawel@ikigai.systems", password = "password", sessionName = "user-session") => {
  cy.session(sessionName, () => {
    // Log in as a user
    cy.visit("/users/sign_in");
    cy.get('input[name="user[email]"]').type(email);
    cy.get('input[name="user[password]"]').type(password);
    cy.get('input[type=submit]').click();
    // Wait for redirect after login
    cy.url().should("not.include", "/users/sign_in");
  }, {
    validate() {
      // Check if session is still valid before reusing
      // If this fails, cy.session will re-run the login
      cy.request("/users/edit").then((response) => {
        expect(response.status).to.eq(200);
        // Verify we got the edit page, not the sign-in page
        expect(response.body).to.include('current_password');
        expect(response.body).to.not.include('Sign in');
      });
    }
  });
});

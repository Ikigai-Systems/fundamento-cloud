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
 * Login action (pure command without session management)
 * Use this inside cy.session() for cached authentication
 * @param {string} email - User email
 * @param {string} password - User password
 * @example
 *   // With session caching
 *   cy.session("user", () => cy.login("user@test.com", "password"));
 *
 *   // Without session caching
 *   cy.login("user@test.com", "password");
 */
Cypress.Commands.add("login", (email, password) => {
  cy.request({
    method: "POST",
    url: "/users/sign_in",
    form: true,
    body: {
      user: {
        email: email,
        password: password,
        authentication_method: "password"
      }
    },
    followRedirect: true
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.not.include("Invalid password");
    expect(response.body).to.not.include("Invalid Email or password");
  });
});

/**
 * Validate user session (use with cy.session validate option)
 * Checks if user is authenticated by requesting edit page
 */
Cypress.Commands.add("validateUserSession", () => {
  cy.request("/users/edit").then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.include("current_password");
    expect(response.body).to.not.include("Sign in");
  });
});

/**
 * Helper: Setup authenticated session with validation
 * This is a convenience wrapper that combines session + login + validation
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} sessionName - Unique session identifier
 * @example
 *   beforeEach(() => {
 *     cy.loginWithSession("user@test.com", "password", "user-session");
 *     cy.visit("/");
 *   });
 */
Cypress.Commands.add("loginWithSession", (email = "pawel@ikigai.systems", password = "password", sessionName = "user-session") => {
  cy.session(sessionName, () => {
    cy.login(email, password);
  }, {
    validate: () => {
      cy.validateUserSession();
    }
  });
});

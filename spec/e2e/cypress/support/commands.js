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
 * Get CSRF token from the current page
 * Extracts the authenticity token from the meta tag
 * @returns {Cypress.Chainable<string>} The CSRF token
 * @example
 *   cy.getCsrfToken().then(token => {
 *     cy.request({
 *       method: "POST",
 *       url: "/api/endpoint",
 *       headers: { "X-CSRF-Token": token },
 *       body: { data: "value" }
 *     });
 *   });
 */
Cypress.Commands.add("getCsrfToken", () => {
  return cy.get('meta[name="csrf-token"]').invoke('attr', 'content');
});

/**
 * Get CSRF token from a page via request
 * Makes a request to get the page HTML and extracts the token
 * Useful when you need a token before visiting the page
 * @param {string} url - The URL to get the token from
 * @returns {Cypress.Chainable<string>} The CSRF token
 * @example
 *   cy.getCsrfTokenFromPage("/users/sign_in").then(token => {
 *     // Use token in subsequent request
 *   });
 */
Cypress.Commands.add("getCsrfTokenFromPage", (url = "/") => {
  return cy.request(url).then((response) => {
    const html = response.body;
    const match = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
    throw new Error(`Could not find CSRF token in response from ${url}`);
  });
});

/**
 * Login action (pure command without session management)
 * Use this inside cy.session() for cached authentication
 * Extracts CSRF token from login page and includes it in the request
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
  // First, get the CSRF token from the login page
  cy.getCsrfTokenFromPage("/users/sign_in").then((token) => {
    cy.request({
      method: "POST",
      url: "/users/sign_in",
      form: true,
      body: {
        authenticity_token: token,
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

/**
 * Make an authenticated POST request with CSRF token
 * Convenience wrapper for POST requests that need CSRF protection
 * @param {string} url - The URL to POST to
 * @param {object} body - The request body
 * @param {object} options - Additional request options
 * @returns {Cypress.Chainable} The request response
 * @example
 *   cy.authenticatedPost("/api/v1/documents", {
 *     title: "New Document",
 *     content: "Document content"
 *   });
 */
Cypress.Commands.add("authenticatedPost", (url, body = {}, options = {}) => {
  return cy.visit("/").then(() => {
    cy.getCsrfToken().then((token) => {
      return cy.request({
        method: "POST",
        url: url,
        headers: {
          "X-CSRF-Token": token,
          ...options.headers
        },
        body: body,
        ...options
      });
    });
  });
});

/**
 * Make an authenticated PATCH request with CSRF token
 * Convenience wrapper for PATCH requests that need CSRF protection
 * @param {string} url - The URL to PATCH to
 * @param {object} body - The request body
 * @param {object} options - Additional request options
 * @returns {Cypress.Chainable} The request response
 * @example
 *   cy.authenticatedPatch("/api/v1/documents/abc123", {
 *     title: "Updated Title"
 *   });
 */
Cypress.Commands.add("authenticatedPatch", (url, body = {}, options = {}) => {
  return cy.visit("/").then(() => {
    cy.getCsrfToken().then((token) => {
      return cy.request({
        method: "PATCH",
        url: url,
        headers: {
          "X-CSRF-Token": token,
          ...options.headers
        },
        body: body,
        ...options
      });
    });
  });
});

/**
 * Make an authenticated DELETE request with CSRF token
 * Convenience wrapper for DELETE requests that need CSRF protection
 * @param {string} url - The URL to DELETE
 * @param {object} options - Additional request options
 * @returns {Cypress.Chainable} The request response
 * @example
 *   cy.authenticatedDelete("/api/v1/documents/abc123");
 */
Cypress.Commands.add("authenticatedDelete", (url, options = {}) => {
  return cy.visit("/").then(() => {
    cy.getCsrfToken().then((token) => {
      return cy.request({
        method: "DELETE",
        url: url,
        headers: {
          "X-CSRF-Token": token,
          ...options.headers
        },
        ...options
      });
    });
  });
});

/**
 * Wait for the document editor to be ready
 * Waits for the BlockNote editor's textbox to exist in the DOM
 * @example
 *   cy.visit("/d/abc123");
 *   cy.waitForEditor();
 */
Cypress.Commands.add("waitForEditor", () => {
  // Wait for the editor controller to set data-editor-ready="true", which
  // happens after the React Editor mounts AND Y.js completes its initial
  // sync from the server. Typing earlier races the sync and can leave the
  // hidden content_blocks input empty or stale.
  cy.get("[data-document-editor][data-editor-ready='true']", {timeout: 10000}).should("exist");
  cy.get("[data-document-editor] [role='textbox']", {timeout: 10000}).should("exist");
});

// =============================================================================
// CSRF TOKEN USAGE EXAMPLES
// =============================================================================
//
// Example 1: Using CSRF token from current page (after cy.visit)
// ---------------------------------------------------------------
// it("creates a document via API", () => {
//   cy.visit("/");
//   cy.getCsrfToken().then(token => {
//     cy.request({
//       method: "POST",
//       url: "/api/v1/documents",
//       headers: { "X-CSRF-Token": token },
//       body: { title: "New Document" }
//     });
//   });
// });
//
// Example 2: Using CSRF token from a specific page
// ------------------------------------------------
// it("submits a form", () => {
//   cy.getCsrfTokenFromPage("/documents/new").then(token => {
//     cy.request({
//       method: "POST",
//       url: "/documents",
//       headers: { "X-CSRF-Token": token },
//       body: { document: { title: "Test" } }
//     });
//   });
// });
//
// Example 3: Using convenience commands (recommended)
// ---------------------------------------------------
// it("creates and updates a document", () => {
//   cy.authenticatedPost("/api/v1/documents", {
//     title: "New Document"
//   }).then(response => {
//     const docId = response.body.id;
//
//     cy.authenticatedPatch(`/api/v1/documents/${docId}`, {
//       title: "Updated Title"
//     });
//
//     cy.authenticatedDelete(`/api/v1/documents/${docId}`);
//   });
// });
//
// Example 4: Form submissions (CSRF token included automatically by Rails)
// ------------------------------------------------------------------------
// it("submits form via UI", () => {
//   cy.visit("/documents/new");
//   cy.get("#document_title").type("New Document");
//   cy.get("form").submit();
//   // Rails automatically includes authenticity_token in forms
//   // No manual CSRF handling needed for form submissions
// });
//
// Example 5: Turbo requests (CSRF token handled automatically)
// ------------------------------------------------------------
// it("navigates with Turbo", () => {
//   cy.visit("/");
//   cy.get("a[data-turbo='true']").click();
//   // Turbo automatically includes CSRF token from meta tag
//   // No manual handling needed
// });

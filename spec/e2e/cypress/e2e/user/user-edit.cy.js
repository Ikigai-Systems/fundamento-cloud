describe("User Edit", function() {
  before(() => {
    cy.app("clean");
    // Load fixtures with users and organizations
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users"]
    });
  });

  beforeEach(() => {
    // Login with session caching and validation
    cy.loginAsUser();

    // Visit edit page after session is restored
    cy.visit("/users/edit");
  });

  it("allows user to edit first and last name", function() {
    // Already on edit page from beforeEach
    // Verify we're on the edit page
    cy.get('form[action="/users"]').should("exist");

    // Clear existing values and enter new ones
    cy.get('input[name="user[first_name]"]').clear().type("John");
    cy.get('input[name="user[last_name]"]').clear().type("Doe");

    // Need to confirm the form with password
    cy.get('input[name="user[current_password]"]').type("password");

    // Submit the form
    cy.get('input[type=submit]').click();

    // Verify we're redirected and see success message
    // cy.url().should("not.include", "/users/edit");
    cy.contains("Your account has been updated successfully").should("be.visible");

    // Navigate back to edit page to verify changes persisted
    cy.visit("/users/edit");
    cy.get('input[name="user[first_name]"]').should("have.value", "John");
    cy.get('input[name="user[last_name]"]').should("have.value", "Doe");
  });

  it("validates required fields", function() {
    // Already on edit page from beforeEach
    // Try to submit with empty first name
    cy.get('input[name="user[first_name]"]').clear();
    cy.get('input[type=submit]').click();

    // Should still be on edit page with error message
    cy.url().should("include", "/users/edit");
    cy.contains("error").should("be.visible");
  });

  it("displays current user information on load", function() {
    // Verify form is populated with current user data
    cy.get('input[name="user[email]"]').should("have.value", "pawel@ikigai.systems");
    cy.get('input[name="user[first_name]"]').invoke("val").should("not.be.empty");
  });
});

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
    // Best practice: Manage session in test, use pure command
    cy.session("pawel-user", () => {
      cy.login("pawel@ikigai.systems", "password");
    }, {
      validate: () => {
        cy.validateUserSession();
      }
    });

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

  it("signs out everywhere after confirming", function() {
    cy.on("window:confirm", (text) => {
      expect(text).to.eq("Sign out on every device, including this one?");
      return true;
    });

    cy.contains("h2", "Signed-in devices", { matchCase: false }).should("be.visible");
    cy.contains("button", "Sign out everywhere").click();

    cy.url().should("include", "/users/sign_in");
    cy.contains("You've been signed out on every device.").should("be.visible");

    cy.visit("/users/edit");
    cy.url().should("include", "/users/sign_in");
  });
});

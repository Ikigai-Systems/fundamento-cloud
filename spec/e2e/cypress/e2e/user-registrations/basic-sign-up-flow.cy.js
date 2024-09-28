describe('Basic features work', function() {
  before(() => {
    cy.app('clean') // have a look at e2e/app_commands/clean.rb

    cy.visit("/");
    cy.contains("Sign up").click();
    cy.get('input[name="user[first_name]"]').type("Pawel");
    cy.get('input[name="user[last_name]"]').type("Nowak");
    cy.get('input[name="user[email]"]').type("pawel.nowak@random.pl");
    cy.get('input[name="user[password]"]').type("password");
    cy.get('input[name="user[password_confirmation]"]').type("password");
    cy.get('input[type=submit]').click();

    cy.contains('Create organization');

    cy.get('input[name="organization[name]"]').type("E2E Tests");
    cy.get('input[type=submit]').click();

    cy.contains("Organization was successfully created");

    cy.get("body nav").contains("PN").click();
    cy.contains("Sign out").click();

    cy.url().should('include', '/users/sign_in');
  });

  beforeEach(() => {
    cy.visit("/");

    cy.get('input[name="user[email]"]').type("pawel.nowak@random.pl");
    cy.get('input[name="user[password]"]').type("password");
    cy.get('input[type=submit]').click();
  });

  it("create new organization", function() {
    cy.visit("/organizations/new");

    cy.get('input[name="organization[name]"]').type("Second organization");
    cy.get('input[type=submit]').click();

    cy.contains("Organization was successfully created");

    cy.contains("Switch to").click();

    cy.contains("Second organization Space");
  })

  it("you can create teams", function() {
    cy.visit("/");

    cy.get("body nav").contains("PN").click();

    cy.contains("Teams").click();

    cy.get(".focused-header").contains("Create").click();
  });
})


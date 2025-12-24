describe('Basic features work', function() {
  before(() => {
    cy.app('clean') // have a look at e2e/app_commands/clean.rb
    cy.appFlipper({flags: ["standalone"]})

    cy.visit("/");
    cy.contains("Sign up").click();
    cy.get('input[name="user[first_name]"]').type("Pawel");
    cy.get('input[name="user[last_name]"]').type("Nowak");
    cy.get('input[name="user[email]"]').type("pawel.nowak@random.pl");
    cy.get('input[name="user[password]"]').type("password");
    cy.get('input[name="user[password_confirmation]"]').type("password");
    cy.get('input[type=submit]').click();

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

  it("you can create a team", function() {
    cy.visit("/organizations");

    // Find the organization row (now has a random name) and switch to it
    cy.get('tbody tr').first().contains('button', 'Switch to').click();

    // Check for any space (now has a random organization name + " Space")
    cy.contains("Space");

    cy.get("#flashes button").click();

    cy.get("body nav").contains("PN").click();

    cy.contains("Teams").click();

    cy.get(".focused-header").contains("Create").click();

    cy.get('input[name="team[name]"]').type("Everyone");
    cy.get('input[name="team[shortcut]"]').type("@everyone");
    cy.get("input.multiselect__search").type("now");

    cy.get(".multiselect__list").contains("Pawel Nowak").click();
    cy.get(".multiselect__preview").click();

    cy.get('input[type=submit]').click();

    cy.location('pathname').should('match', /^\/teams\/.+/)
  });
})


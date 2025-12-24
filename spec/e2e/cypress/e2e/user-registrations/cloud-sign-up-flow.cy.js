describe('Cloud sign up flow', function() {
  before(() => {
    cy.app('clean') // have a look at e2e/app_commands/clean.rb
    cy.appFlipper({flags: []})
  });

  beforeEach(() => {
    cy.visit("/");

    cy.get('input[name="user[email]"]').type("pawel.nowak@random.pl");
    cy.get('input[name="user[password]"]').type("password");
    cy.get('input[type=submit]').click();
  });

  it("you can sign up with cloud", function() {
    cy.visit("/");
    cy.contains("Sign up").click();
    // cy.get('input[name="user[first_name]"]').type("Pawel");
    // cy.get('input[name="user[last_name]"]').type("Nowak");
    cy.get('input[name="user[email]"]').type("pawel.nowak@random.pl");
    // cy.get('input[name="user[password]"]').type("password");
    // cy.get('input[name="user[password_confirmation]"]').type("password");
    cy.get('input[type=submit]').click();

    cy.contains("Check your email");
  })
})


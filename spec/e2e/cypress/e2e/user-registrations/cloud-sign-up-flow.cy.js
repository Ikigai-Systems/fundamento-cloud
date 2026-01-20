describe('Cloud sign up flow', function() {
  before(() => {
    cy.app('clean') // have a look at e2e/app_commands/clean.rb
    cy.appFlipper({flags: []})
  });

  it("you can sign up with cloud", function() {
    cy.visit("/");
    cy.contains("Sign up").click();

    cy.url().should('include', '/users/sign_up');
    cy.get('input[name="user[email]"]').type("pawel.nowak@random.pl");
    cy.get('input[type=submit]').click();

    cy.contains("Check your email");

    // Get the confirmation URL and visit it
    cy.appUserConfirmationUrl({email: "pawel.nowak@random.pl"}).then((confirmationUrl) => {
      cy.visit(confirmationUrl);
      // Add assertion for successful confirmation
      cy.contains("Favorites");
    });
  })
})


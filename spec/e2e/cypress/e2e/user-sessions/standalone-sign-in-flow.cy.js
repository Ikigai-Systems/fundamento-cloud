describe('Standalone sign-in flow', function () {
  before(() => {
    cy.app('clean');
    cy.appFlipper({flags: ['standalone']});
  });

  beforeEach(() => {
    cy.app('clean');
    cy.appFlipper({flags: ['standalone']});
    // Create user with password
    cy.appFactories([
      ['create', 'user', {
        email: 'standalone@example.com',
        password: 'Password123!',
        confirmed_at: new Date().toISOString()
      }]
    ]);
  });

  it('can sign in with email and password in one step', () => {
    cy.visit('/users/sign_in');

    // Fill in both fields
    cy.get('input[name="user[email]"]').type('standalone@example.com');
    cy.get('input[name="user[password]"]').type('Password123!');
    cy.get('input[type=submit]').click();

    // Should be signed in
    cy.url().should('not.include', '/users/sign_in');
    cy.contains('Favorites');
  });

  it('shows error for wrong credentials', () => {
    cy.visit('/users/sign_in');

    // Fill in wrong password
    cy.get('input[name="user[email]"]').type('standalone@example.com');
    cy.get('input[name="user[password]"]').type('WrongPassword!');
    cy.get('input[type=submit]').click();

    // Should see Devise error
    cy.contains('Invalid Email or password');
    cy.url().should('include', '/users/sign_in');

    cy.get('input[name="user[password]"]').should('have.value', '');
  });
});

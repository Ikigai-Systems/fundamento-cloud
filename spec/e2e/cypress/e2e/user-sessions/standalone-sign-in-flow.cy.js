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
        first_name: "Standalone",
        last_name: "User",
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

  it('displays remember me checkbox', () => {
    cy.visit('/users/sign_in');

    // Remember me checkbox should be visible
    cy.get('input[type="checkbox"][name="user[remember_me]"]').should('be.visible');
    cy.contains('Remember me').should('be.visible');
  });

  it('can sign in with remember me checked', () => {
    cy.visit('/users/sign_in');

    // Fill in credentials
    cy.get('input[name="user[email]"]').type('standalone@example.com');
    cy.get('input[name="user[password]"]').type('Password123!');

    // Check remember me
    cy.get('input[type="checkbox"][name="user[remember_me]"]').check();
    cy.get('input[type="checkbox"][name="user[remember_me]"]').should('be.checked');

    cy.get('input[type=submit]').click();

    // Should be signed in
    cy.url().should('not.include', '/users/sign_in');
    cy.contains('Favorites');

    // Verify remember_user_token cookie is set
    cy.getCookie('remember_user_token').should('exist');
  });

  it('can sign in without remember me', () => {
    cy.visit('/users/sign_in');

    // Fill in credentials
    cy.get('input[name="user[email]"]').type('standalone@example.com');
    cy.get('input[name="user[password]"]').type('Password123!');

    // Ensure remember me is not checked
    cy.get('input[type="checkbox"][name="user[remember_me]"]').should('not.be.checked');

    cy.get('input[type=submit]').click();

    // Should be signed in
    cy.url().should('not.include', '/users/sign_in');
    cy.contains('Favorites');

    // Verify remember_user_token cookie is not set
    cy.getCookie('remember_user_token').should('not.exist');
  });
});

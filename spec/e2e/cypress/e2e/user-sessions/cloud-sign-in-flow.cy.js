describe('Cloud sign-in flow', function () {
  before(() => {
    cy.app('clean');
    cy.appFlipper({flags: []}); // Disable standalone flag
  });

  context('User with password', () => {
    beforeEach(() => {
      cy.app('clean');
      cy.appFlipper({flags: []});
      // Create user with password and confirm them
      cy.appFactories([
        ['create', 'user', {
          email: 'password@example.com',
          password: 'Password123!',
          confirmed_at: new Date().toISOString()
        }]
      ]);
    });

    it('can sign in with password', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('password@example.com');
      cy.get('input[type=submit]').click();

      // Step 2: Should see password field and magic link option
      cy.contains('Welcome back');
      cy.contains('Signing in as password@example.com');
      cy.get('input[name="user[password]"]').should('be.visible');
      cy.contains('Sign in with password');
      cy.contains('Email me a sign-in link');

      // Enter password and submit
      cy.get('input[name="user[password]"]').type('Password123!');
      cy.get('input[type=submit]').contains('Sign in with password').click();

      // Should be signed in
      cy.url().should('not.include', '/users/sign_in');
      cy.contains('Favorites');
    });

    it('shows error for wrong password', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('password@example.com');
      cy.get('input[type=submit]').click();

      // Step 2: Enter wrong password
      cy.get('input[name="user[password]"]').type('WrongPassword123!');
      cy.get('input[type=submit]').contains('Sign in with password').click();

      // Should see error
      cy.contains('Invalid Email or password');
      cy.url().should('include', '/users/sign_in');
    });

    it('can request magic link instead of using password', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('password@example.com');
      cy.get('input[type=submit]').click();

      // Step 2: Click magic link button
      cy.contains('Email me a sign-in link').click();

      // Should see confirmation page
      cy.contains('Check your inbox');
      cy.contains('We sent a sign-in link to password@example.com');
    });

    it('can use different email from options page', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('password@example.com');
      cy.get('input[type=submit]').click();

      // Step 2: Click "Use different email"
      cy.contains('Use different email').click();

      // Should be back at step 1
      cy.url().should('include', '/users/sign_in');
      cy.get('input[name="user[email]"]').should('be.visible');
      cy.get('input[name="user[password]"]').should('not.exist');
    });
  });

  context('Passwordless user', () => {
    beforeEach(() => {
      cy.app('clean');
      cy.appFlipper({flags: []});
      // Create user without password (encrypted_password empty)
      cy.appFactories([
        ['create', 'user', {
          email: 'passwordless@example.com',
          encrypted_password: '',
          confirmed_at: new Date().toISOString()
        }]
      ]);
    });

    it('automatically sends magic link after entering email', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('passwordless@example.com');
      cy.get('input[type=submit]').click();

      // Should automatically see confirmation page (no password prompt)
      cy.contains('Check your inbox');
      cy.contains('We sent a sign-in link to passwordless@example.com');
      cy.contains('Resend email');
    });

    it('can resend magic link from confirmation page', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('passwordless@example.com');
      cy.get('input[type=submit]').click();

      // On confirmation page, click resend
      cy.contains('Resend email').click();

      // Should still be on confirmation page
      cy.contains('Check your inbox');
      cy.contains('We sent a sign-in link to passwordless@example.com');
    });

    it('can use different email from confirmation page', () => {
      cy.visit('/users/sign_in');

      // Step 1: Enter email
      cy.get('input[name="user[email]"]').type('passwordless@example.com');
      cy.get('input[type=submit]').click();

      // Click "Use different email"
      cy.contains('Use different email').click();

      // Should be back at step 1
      cy.url().should('include', '/users/sign_in');
      cy.get('input[name="user[email]"]').should('be.visible');
    });
  });

  context('Non-existent user', () => {
    beforeEach(() => {
      cy.app('clean');
      cy.appFlipper({flags: []});
    });

    it('shows error for non-existent email', () => {
      cy.visit('/users/sign_in');

      // Try to sign in with non-existent email
      cy.get('input[name="user[email]"]').type('nonexistent@example.com');
      cy.get('input[type=submit]').click();

      // Should see error message
      cy.contains("We couldn't find an account with that email address");
      cy.url().should('include', '/users/sign_in');

      // Should still be on step 1
      cy.get('input[name="user[email]"]').should('be.visible');
      cy.get('input[name="user[password]"]').should('not.exist');
    });
  });
});

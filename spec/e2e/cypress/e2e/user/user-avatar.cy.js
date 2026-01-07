describe("User Avatar", function() {
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

  it("allows user to change avatar", function() {
    cy.get('[data-action="modal#open"]').click();

    cy.get("#modal").within(() => {
      // Upload first avatar using selectFile
      cy.get('input[type="file"][name="user[avatar]"]').selectFile("cypress/fixtures/images/test-avatar.png");

      cy.get('button[type=submit]').click();
    });

    cy.get("#modal").should("not.be.visible");

    // Get the first avatar URL
    let firstAvatarSrc;
    cy.get('img[alt*="avatar"]').invoke("attr", "src").then((src) => {
      firstAvatarSrc = src;
    });

    // Navigate back and upload a different avatar
    cy.visit("/users/edit");

    cy.get('[data-action="modal#open"]').click();

    cy.get("#modal").within(() => {
      // Upload first avatar using selectFile
      cy.get('input[type="file"][name="user[avatar]"]').selectFile("cypress/fixtures/images/test-avatar-2.png");

      cy.get('button[type=submit]').click();
    });

    cy.get("#modal").should("not.be.visible");

    // Verify the avatar has changed
    cy.get('img[alt*="avatar"]').invoke("attr", "src").should((newSrc) => {
      expect(newSrc).to.not.equal(firstAvatarSrc);
    });
  });
});

describe("Cookie Banner", () => {
  context("Cloud mode (non-standalone)", () => {
    beforeEach(() => {
      cy.app("clean");
      cy.appFlipper({ flags: [] });
      cy.appFactories([
        ["create", "user", {
          email: "test@example.com",
          password: "Password123!",
          confirmed_at: new Date().toISOString(),
        }],
      ]);
    });

    it("shows cookie banner on first visit", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-test");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("We use cookies").should("be.visible");
      cy.contains("Accept").should("be.visible");
      cy.contains("Decline").should("be.visible");
    });

    it("hides banner after accepting", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-accept");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Accept").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("hides banner after declining", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-decline");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Decline").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("does not show banner again after accepting", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-persist");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Accept").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");

      // Revisit
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("does not show banner again after declining", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-persist-decline");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("be.visible");
      cy.contains("Decline").click();
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");

      // Revisit
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("not.be.visible");
    });

    it("links to privacy policy", () => {
      cy.loginWithSession("test@example.com", "Password123!", "cookie-privacy");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']")
        .find("a[href='https://fundamento.it/privacy-policy']")
        .should("exist")
        .should("have.attr", "target", "_blank");
    });
  });

  context("Standalone mode", () => {
    beforeEach(() => {
      cy.app("clean");
      cy.appFlipper({ flags: ["standalone"] });
      cy.appFactories([
        ["create", "user", {
          email: "standalone@example.com",
          first_name: "Standalone",
          last_name: "User",
          password: "Password123!",
          confirmed_at: new Date().toISOString(),
        }],
      ]);
    });

    it("does not show cookie banner", () => {
      cy.loginWithSession("standalone@example.com", "Password123!", "standalone-cookie");
      cy.visit("/");
      cy.get("[data-controller='cookie-banner']").should("not.exist");
    });
  });
});

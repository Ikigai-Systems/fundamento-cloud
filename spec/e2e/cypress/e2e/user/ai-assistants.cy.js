describe("AI Assistants", function() {
  before(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces"]
    });
  });

  beforeEach(() => {
    // Maria is only in HeroCoders, so no organization has to be picked first
    cy.session("maria-user", () => {
      cy.login("maria@ikigai.systems", "password");
    }, {
      validate: () => {
        cy.validateUserSession();
      }
    });
  });

  it("gives the organization's MCP URL from the user menu and copies it", function() {
    const mcpUrl = `${Cypress.config().baseUrl}/api/mcp/organizations/hc`;

    cy.visit("/");
    cy.get("#user-dropdown").click();
    cy.contains("[role=menu] a", "Integrations").click();

    cy.url().should("eq", `${Cypress.config().baseUrl}/integrations/ai-assistants`);
    cy.get("[data-testid=mcp-url]").should("have.value", mcpUrl);
    cy.contains("This URL is for HeroCoders only");

    cy.window().then(win => {
      cy.stub(win.navigator.clipboard, "writeText").resolves().as("writeText");
    });
    cy.get("[data-testid=copy-mcp-url]").click();

    cy.get("@writeText").should("have.been.calledOnceWith", mcpUrl);
    cy.get("[data-testid=copy-mcp-url]").should("contain", "Copied!");
  });
});

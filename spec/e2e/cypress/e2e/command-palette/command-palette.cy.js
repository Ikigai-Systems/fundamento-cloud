import {isOrganizationCookie} from "../../support/organization-cookies";

// Helper function to find and click a command by title
function clickCommand(title) {
  cy.get("ninja-keys").then($el => {
    const shadowRoot = $el[0].shadowRoot;
    const actions = shadowRoot?.querySelectorAll("ninja-action") || [];

    for (const action of actions) {
      const actionShadow = action.shadowRoot;
      const titleEl = actionShadow?.querySelector(".ninja-title");
      const text = titleEl?.textContent?.trim();

      const isMatch = title instanceof RegExp
        ? title.test(text)
        : text === title;

      if (isMatch) {
        const clickableEl = actionShadow?.querySelector(".ninja-action");
        if (clickableEl) {
          clickableEl.click();
          return;
        }
      }
    }
  });
}

function clickFirstCommand() {
  cy.get("ninja-keys").shadow().find("ninja-action").first().click();
}

describe("Command Palette (Ctrl+K)", () => {
  const email = "pawel@ikigai.systems";
  const password = "password";

  before(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "space_memberships",
        "documents",
        "tables/tables",
        "tables/columns",
        "tables/rows",
        "tables/cells",
        "teams",
        "team_memberships"
      ]
    });
  });

  beforeEach(() => {
    cy.loginWithSession(email, password);
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  describe("Opening the command palette", () => {
    it("opens with Ctrl+K keyboard shortcut", () => {
      cy.visit("/");

      // Command palette should not be visible initially
      cy.get("ninja-keys").should("exist");
      cy.get("ninja-keys").shadow()
        .find(".modal").should("not.have.class", "visible");
      
      // Press Ctrl+K (Cmd+K on Mac)
      cy.get("body").type("{ctrl}k");
      
      cy.get("ninja-keys").shadow()
        .find(".modal").should("have.class", "visible");
    });

    it("displays default commands when opened", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      // Check for default commands in the shadow DOM
      cy.get("ninja-keys").then($el => {
        const shadowRoot = $el[0].shadowRoot;
        const actions = shadowRoot?.querySelectorAll("ninja-action") || [];

        const commandTexts = Array.from(actions).map(action => {
          const actionShadow = action.shadowRoot;
          const title = actionShadow?.querySelector(".ninja-title");
          return title?.textContent?.trim() || "";
        });

        expect(commandTexts).to.include("Go to dashboard");
        expect(commandTexts).to.include("View all organizations");
        expect(commandTexts).to.include("View all spaces");
        expect(commandTexts).to.include("View all teams");
        expect(commandTexts).to.include("Go to account settings");
      });
    });

    it("closes with Escape key", () => {
      // Note: Skipping due to Cypress limitation with escape key handling in shadow DOM
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      // Verify modal is open
      cy.get("ninja-keys").then($el => {
        const shadowRoot = $el[0].shadowRoot;
        const header = shadowRoot?.querySelector("ninja-header");
        const headerShadow = header?.shadowRoot;
        const searchInput = headerShadow?.querySelector("#search");

        const modal = shadowRoot?.querySelector(".modal");
        expect(modal?.classList.contains("visible")).to.be.true;

        expect(searchInput).to.exist;

        cy.wrap(searchInput).type("{esc}");
      });

      cy.wait(300);
      cy.get("ninja-keys").then($el => {
        const modal = $el[0].shadowRoot?.querySelector(".modal");
        expect(modal?.classList.contains("visible")).to.be.false;
      });
    });
  });

  describe("Navigation to user account page", () => {
    it("navigates to account settings", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      clickCommand("Go to account settings");

      // Should navigate to user edit page
      cy.url().should("include", "/users/edit");
    });
  });

  describe("Navigation to index pages", () => {
    it("navigates to organizations page", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      clickCommand("View all organizations");

      cy.url().should("include", "/organizations");
    });

    it("navigates to spaces page", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      clickCommand("View all spaces");

      cy.url().should("include", "/s");
    });

    it("navigates to teams page", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      clickCommand("View all teams");

      cy.url().should("include", "/teams");
    });

    it("navigates to dashboard", () => {
      cy.visit("/s");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      clickCommand("Go to dashboard");

      cy.url().should("include", "/#spaces");
    });
  });

  describe("Search functionality", () => {
    it("shows search input in command palette", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      // Access nested shadow DOM to find search input
      cy.get("ninja-keys").then($el => {
        const shadowRoot = $el[0].shadowRoot;
        const header = shadowRoot?.querySelector("ninja-header");
        const headerShadow = header?.shadowRoot;
        const searchInput = headerShadow?.querySelector("#search");

        expect(searchInput).to.exist;
      });
    });

    it("accepts search input", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");

      // Type into the search input
      cy.get("ninja-keys").shadow()
        .find(".modal").should("have.class", "visible");

      cy.get("ninja-keys").shadow()
        .find("ninja-header").shadow()
        .find("#search").type("one");

      cy.wait(700);
      clickCommand(/One/);

      cy.url().should("include", "/d/one");

      // Open palette again and search for "two"
      cy.get("body").type("{ctrl}k");

      cy.get("ninja-keys").shadow()
        .find(".modal").should("have.class", "visible");

      cy.get("ninja-keys").shadow()
        .find("ninja-header").shadow()
        .find("#search").type("two");

      cy.wait(700);
      clickCommand(/Two/);

      cy.url().should("include", "/d/two");
    });
  });

  describe("Keyboard navigation", () => {
    it("shows selected state on commands", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      // Check for selected command (first one is selected by default)
      cy.get("ninja-keys").then($el => {
        const shadowRoot = $el[0].shadowRoot;
        const actions = shadowRoot?.querySelectorAll("ninja-action") || [];

        let hasSelected = false;
        for (const action of actions) {
          const actionShadow = action.shadowRoot;
          const actionDiv = actionShadow?.querySelector(".ninja-action");
          if (actionDiv?.classList.contains("selected")) {
            hasSelected = true;
            break;
          }
        }

        expect(hasSelected).to.be.true;
      });
    });
  });

  describe("User context", () => {
    it("shows appropriate commands based on user permissions", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      cy.get("ninja-keys").then($el => {
        const shadowRoot = $el[0].shadowRoot;
        const actions = shadowRoot?.querySelectorAll("ninja-action") || [];

        const commandTexts = Array.from(actions).map(action => {
          const actionShadow = action.shadowRoot;
          const title = actionShadow?.querySelector(".ninja-title");
          return title?.textContent?.trim() || "";
        });

        // User should see all navigation options
        expect(commandTexts).to.include("View all organizations");
        expect(commandTexts).to.include("View all spaces");
        expect(commandTexts).to.include("View all teams");
      });
    });
  });

  describe("Edge cases", () => {
    it("maintains palette functionality after navigation", () => {
      cy.visit("/");
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      // Navigate somewhere
      clickCommand("View all spaces");

      cy.url().should("include", "/s");

      // Open palette again on new page
      cy.get("body").type("{ctrl}k");
      cy.wait(300);

      // Should show default commands
      cy.get("ninja-keys").then($el => {
        const shadowRoot = $el[0].shadowRoot;
        const actions = shadowRoot?.querySelectorAll("ninja-action") || [];

        const commandTexts = Array.from(actions).map(action => {
          const actionShadow = action.shadowRoot;
          const title = actionShadow?.querySelector(".ninja-title");
          return title?.textContent?.trim() || "";
        });

        expect(commandTexts).to.include("Go to dashboard");
      });
    });
  });
});

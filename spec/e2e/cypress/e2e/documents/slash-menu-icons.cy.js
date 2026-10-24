import {isOrganizationCookie} from "../../support/organization-cookies.js";

const editPageUrl = /\/d\/[_\-a-zA-Z0-9]+\/edit$/;

// Our own slash menu items (CommonSuggestionMenus.tsx) sit in the same list as BlockNote's
// built-in ones, so their icons must take the same box, sit centred in it and leave the label
// where the built-ins have it.
const OUR_TITLES = ["Advanced table", "Chart", "Button", "Formula"];

describe("Slash menu icons", function () {
  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("sizes and aligns our items like BlockNote's", function () {
    cy.visit("/s/is_default");
    cy.openSidebar().find('[aria-label="Create new document"]').click();

    cy.url().should("match", editPageUrl);
    cy.waitForEditor();

    cy.get("[data-document-editor] [role=\"textbox\"]").first().click();
    cy.focused().type("/");
    cy.get(".bn-suggestion-menu").should("be.visible");

    cy.get(".bn-suggestion-menu-item").should(($items) => {
      const titles = $items.toArray().map((item) => item.querySelector(".bn-mt-suggestion-menu-item-title").textContent);
      OUR_TITLES.forEach((title) => expect(titles, "slash menu titles").to.include(title));
    }).then(($items) => {
      const measure = (item) => {
        const section = item.querySelector("[data-position=left]");
        const icon = section.firstElementChild;
        return {
          title: item.querySelector(".bn-mt-suggestion-menu-item-title").textContent,
          section: section.getBoundingClientRect(),
          icon: icon.getBoundingClientRect(),
          label: item.querySelector(".bn-mt-suggestion-menu-item-title").getBoundingClientRect(),
        };
      };
      const items = $items.toArray().map(measure);
      // The first item is a built-in (Heading 1).
      const reference = items[0];

      items.forEach(({title, section, icon, label}) => {
        expect(section.width, `${title} icon box width`).to.be.closeTo(reference.section.width, 0.5);
        expect(section.height, `${title} icon box height`).to.be.closeTo(reference.section.height, 0.5);
        expect(icon.width, `${title} icon width`).to.be.closeTo(reference.icon.width, 0.5);
        expect(icon.height, `${title} icon height`).to.be.closeTo(reference.icon.height, 0.5);
        expect(icon.left + icon.width / 2, `${title} icon centre x`).to.be.closeTo(section.left + section.width / 2, 0.5);
        expect(icon.top + icon.height / 2, `${title} icon centre y`).to.be.closeTo(section.top + section.height / 2, 0.5);
        expect(label.left, `${title} label x`).to.be.closeTo(reference.label.left, 0.5);
      });
    });
  });
});

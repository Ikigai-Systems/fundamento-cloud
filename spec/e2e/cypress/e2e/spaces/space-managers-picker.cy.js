import {isOrganizationCookie} from "../../support/organization-cookies.js";

// The space managers picker draws users the way the rest of the app does:
// their uploaded avatar, or initials.
describe("Space managers picker", function () {
  // 1x1 PNG; public/ is not in the E2E image, so there is no file to attach.
  const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces"]
    });
    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  function searchFor(query) {
    cy.visit("/s/is_default/edit");
    cy.get(".multiselect__container").click();
    cy.get(".multiselect__search").type(query);
  }

  it("shows a user's avatar in the list and on the pill once picked", function () {
    cy.appEval(`
      User.find_by(email: "stefan@ikigai.systems").avatar.attach(
        io: StringIO.new(Base64.decode64("${PNG}")), filename: "stefan.png", content_type: "image/png"
      )
    `);

    searchFor("Stefan");

    cy.get(".multiselect__list label").filter(":contains('Stefan')").as("item");
    cy.get("@item").find(".member-avatar img").should("have.attr", "src").and("include", "stefan.png");
    cy.get("@item").click();

    cy.get(".multiselect__pill").filter(":contains('Stefan')")
      .find(".member-avatar img").should("have.attr", "src").and("include", "stefan.png");
  });

  it("shows initials for a user without an avatar", function () {
    searchFor("Stefan");

    cy.get(".multiselect__list label").filter(":contains('Stefan')")
      .find(".member-avatar svg").should("exist");
  });

  // The picker library interpolated names into its HTML unescaped.
  it("shows a name containing HTML as text", function () {
    cy.appEval(`User.find_by(email: "stefan@ikigai.systems").update!(first_name: "<b>Bold</b>")`);

    searchFor("Bold");

    cy.get(".multiselect__list label").should("contain", "<b>Bold</b>");
    cy.get(".multiselect__list b").should("not.exist");
  });
});

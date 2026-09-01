import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Space sidebar tabs", function () {
  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents"],
    });
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [{ "id" => "one", "children" => [] }, { "id" => "two", "children" => [] }])
    `);
    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("opens on the Hierarchy tab with the document tree loaded", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar #hierarchy").should("have.attr", "aria-selected", "true");
    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("#space-sidebar #space_starred_list").should("not.exist");
  });

  it("does not fetch the Starred tab until it is opened", function () {
    cy.intercept("GET", /\/s\/.*\/sidebar\?.*tab=starred/).as("starredTab");
    cy.visit("/d/one");

    // The hierarchy tab is loaded, so the sidebar has finished its eager work by now.
    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("@starredTab.all").should("have.length", 0);

    cy.get("#space-sidebar #starred").click();

    cy.wait("@starredTab");
    cy.contains("No starred items").should("be.visible");
  });

  it("adds and removes an item as it is starred and unstarred", function () {
    cy.visit("/d/one");
    cy.get("#space-sidebar #starred").click();
    cy.contains("No starred items").should("be.visible");

    // Starred from elsewhere (the fixture document opens in edit mode, which has no star
    // button); what this asserts is that the broadcast alone fills the open list.
    cy.appEval(`
      OrganizationMembership.find("om_is_pawel").favorites.create!(object: Document.find("one"))
    `);

    cy.get("#space_starred_list a.content-link[href='/d/one']").should("exist");
    cy.contains("No starred items").should("not.be.visible");

    cy.get("#space_starred_list form button").click();

    cy.get("#space_starred_list a.content-link").should("not.exist");
    cy.contains("No starred items").should("be.visible");
  });

  it("leaves out items starred in another space", function () {
    cy.appEval(`
      other = Space.create!(organization_id: "is", name: "Other Space", access_mode: :public)
      doc = Document.create!(organization_id: "is", space_id: other.id, title: "Other Space Doc")
      membership = OrganizationMembership.find("om_is_pawel")
      membership.favorites.create!(object: doc)
      membership.favorites.create!(object: Document.find("one"))
    `);

    cy.visit("/d/one");
    cy.get("#space-sidebar #starred").click();

    cy.get("#space_starred_list a.content-link[href='/d/one']").should("exist");
    cy.get("#space_starred_list").should("not.contain", "Other Space Doc");
  });

  it("navigates the content frame from a starred item without reloading the sidebar", function () {
    cy.appEval(`
      OrganizationMembership.find("om_is_pawel").favorites.create!(object: Document.find("two"))
    `);

    cy.visit("/d/one");
    cy.get("#space-sidebar #starred").click();
    cy.get("#space_starred_list a.content-link[href='/d/two']").should("exist");

    cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

    cy.get("#space_starred_list a.content-link[href='/d/two']").click();

    cy.url().should("include", "/d/two");
    cy.get("@sidebarReload.all").should("have.length", 0);
    // The tab the user was on survives, because only the content frame navigated.
    cy.get("#space-sidebar #starred").should("have.attr", "aria-selected", "true");
  });
});

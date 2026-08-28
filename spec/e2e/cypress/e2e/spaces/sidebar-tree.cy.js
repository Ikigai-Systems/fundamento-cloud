import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Space sidebar tree", function () {
  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents"],
    });
    // Nest "two" under "one" so we can test expansion.
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [{ "id" => "one", "children" => [{ "id" => "two", "children" => [] }] }])
    `);
    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("renders only root nodes until a node is expanded", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });

  it("removes children from the DOM again when collapsed", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();
    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");
  });

  it("does not render the whole tree into the DOM", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    // Scoped to the sidebar-tree's own root — the Tables section below it reuses
    // .section-content-node-container, so an unscoped selector would pass vacuously
    // whenever no table fixtures are loaded.
    cy.get("#space-sidebar [data-sidebar-tree-target='root'] li.section-content-node-container").should("have.length", 1);
  });

  it("keeps archived documents hidden until the toggle is switched on", function () {
    cy.appEval(`Document.find("two").update!(archived: true)`);
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container")
      .should("not.be.visible");

    cy.contains("Show archived:").parent().find("button[role='switch']").click();

    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container")
      .should("be.visible");
  });

  it("remembers which nodes are expanded across a reload", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");

    cy.reload();

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });

  it("remembers a collapse across a reload", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();

    cy.reload();

    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");
  });

  it("keeps expansion state separate per space", function () {
    cy.visit("/d/one");
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();

    cy.window().then((win) => {
      expect(win.localStorage.getItem("fundamento:sidebar:expanded:is_default")).to.contain("one");
      expect(win.localStorage.getItem("fundamento:sidebar:expanded:hc_default")).to.equal(null);
    });
  });

  it("expands the ancestor path of the open document", function () {
    cy.visit("/d/two");

    // "two" is nested under "one" and must be revealed without any interaction.
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container")
      .should("have.class", "selected");
  });

  it("scrolls the open document into view", function () {
    cy.visit("/d/two");

    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container.selected")
      .should("be.visible");
  });

  it("expands to the open document even when the stored state has it collapsed", function () {
    cy.visit("/d/one");
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();

    cy.visit("/d/two");

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });

  it("still persists a reorder via drag and drop", function () {
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [
        { "id" => "one", "children" => [] },
        { "id" => "two", "children" => [] }
      ])
    `);
    cy.visit("/d/one");

    cy.intercept("PUT", /\/s\/.*\/reorder_hierarchy/).as("reorder");
    cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

    const dataTransfer = new DataTransfer();
    cy.get("#space-sidebar li[data-node-id='two']").trigger("dragstart", {dataTransfer});
    cy.get("#space-sidebar li[data-node-id='one']").trigger("dragenter", {dataTransfer});
    cy.get("#space-sidebar li[data-node-id='one']").trigger("dragover", {dataTransfer});
    // html5sortable positions the drop placeholder via a debounced (0ms) handler; give the
    // browser's event loop a tick to run it before dropping.
    cy.wait(100);
    cy.get("#space-sidebar li[data-node-id='one']").trigger("drop", {dataTransfer});
    cy.get("#space-sidebar li[data-node-id='two']").trigger("dragend", {dataTransfer});

    cy.wait("@reorder").its("response.statusCode").should("be.oneOf", [200, 204]);
  });
});

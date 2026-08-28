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
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");

    // A second space in the same org ("is"), with its own nested hierarchy, so we can prove
    // isolation without the heavier machinery an org switch (e.g. into "hc") would need.
    cy.appEval(`
      space2 = Space.create!(organization_id: "is", name: "Second IS Space", access_mode: :public)
      doc_a = Document.create!(organization_id: "is", space_id: space2.id, title: "Space2 A")
      doc_b = Document.create!(organization_id: "is", space_id: space2.id, title: "Space2 B")
      space2.update!(hierarchy: [{ "id" => doc_a.id, "children" => [{ "id" => doc_b.id, "children" => [] }] }])
      "#{space2.id}|#{doc_a.id}"
    `).then((result) => {
      const [space2Id, docAId] = result.split("|");

      cy.visit(`/d/${docAId}`);
      cy.get(`#space-sidebar li[data-node-id='${docAId}'] .collapsible-trigger`).click();
      cy.get(`#space-sidebar li[data-node-id='${docAId}'] .content-link-container`).should("have.class", "selected");

      cy.window().then((win) => {
        const isDefaultExpanded = JSON.parse(win.localStorage.getItem("fundamento:sidebar:expanded:is_default") || "[]");
        const space2Expanded = JSON.parse(win.localStorage.getItem(`fundamento:sidebar:expanded:${space2Id}`) || "[]");

        // Each space's key holds its own node and nothing from the other — a shared/global
        // key would either merge these lists or leak one space's ids into the other's key.
        expect(isDefaultExpanded).to.include("one");
        expect(isDefaultExpanded).to.not.include(docAId);

        expect(space2Expanded).to.include(docAId);
        expect(space2Expanded).to.not.include("one");
      });
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
    // The 2-node fixture from beforeEach never overflows the sidebar panel, so "two" would be
    // trivially visible with or without scrollSelectedIntoView. Push it far below the fold with
    // enough filler root documents that it is genuinely clipped by the sidebar's
    // `.overflow-y-auto` ancestor unless the controller explicitly scrolls it into view.
    cy.appEval(`
      space = Space.find("is_default")
      filler_ids = 80.times.map { |i| Document.create!(organization_id: "is", space_id: "is_default", title: "Filler #{i}").id }
      space.update!(hierarchy: filler_ids.map { |id| { "id" => id, "children" => [] } } + [{ "id" => "one", "children" => [{ "id" => "two", "children" => [] }] }])
    `);

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

  it("nests a document under another via drag and drop", function () {
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
    // browser's event loop a tick to run it before dropping. Polling for the placeholder
    // element is brittle here because html5sortable removes it from the DOM again the moment
    // drop is processed, so there is no stable element to assert on in between.
    cy.wait(100);
    cy.get("#space-sidebar li[data-node-id='one']").trigger("drop", {dataTransfer});
    cy.get("#space-sidebar li[data-node-id='two']").trigger("dragend", {dataTransfer});

    // Dropping "two" onto "one" lands it in "one"'s own (empty) draggable container, i.e. this
    // exercises nesting, not a root-level sibling reorder — confirmed by the destination
    // parentId being set, which is also why the sidebar frame reload fires below.
    cy.wait("@reorder").its("response.statusCode").should("be.oneOf", [200, 204]);
    cy.wait("@sidebarReload");

    cy.appEval(`Space.find("is_default").hierarchy`).then((hierarchy) => {
      expect(hierarchy).to.deep.equal([
        {id: "one", children: [{id: "two", children: []}]},
      ]);
    });
  });
});

import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Space sidebar tabs", function () {
  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents", "versions"],
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

    // The archived toggle sits on the panel's bottom edge. The tabs stylesheet pads every panel
    // by default, and that padding outranks a utility class, so it would lift the toggle away.
    cy.get("#space-sidebar [data-tabs-target='panel']:not(.hidden)").then(($panel) => {
      const panel = $panel[0].getBoundingClientRect();
      const toggle = $panel[0].querySelector(".mt-auto").getBoundingClientRect();
      expect(Math.round(panel.bottom - toggle.bottom)).to.equal(0);
    });
  });

  it("draws the spaces dropdown over the tab bar", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar #spaces-dropdown").click();
    cy.get("#space-sidebar [data-dropdown-target='menu']").should("be.visible");

    // The open menu hangs over the tab bar, which is positioned with a z-index of its own and
    // comes later in the DOM — at the same level the tabs would paint over the menu, so being
    // "visible" is not enough: the menu has to be the element actually on top.
    cy.get("#space-sidebar [data-dropdown-target='menu']").then(($menu) => {
      const menu = $menu[0].getBoundingClientRect();
      const tabs = Cypress.$("#space-sidebar nav[data-tabs-target='list']")[0].getBoundingClientRect();
      const x = Math.max(menu.left, tabs.left) + 2;
      const y = Math.max(menu.top, tabs.top) + 2;
      expect(y, "the menu and the tab bar overlap").to.be.lessThan(Math.min(menu.bottom, tabs.bottom));

      cy.document().then((doc) => {
        expect($menu[0].contains(doc.elementFromPoint(x, y))).to.be.true;
      });
    });
  });

  it("names the tabs with a tooltip rather than visible text", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar #hierarchy").should("not.contain.text", "Hierarchy");

    cy.get("#space-sidebar #starred [data-controller='popover']").trigger("mouseenter");

    cy.get("#space-sidebar .popover-tooltip-card").should("contain", "Starred");

    // The tooltip hangs over the Documents header, which is sticky with z-10 and comes later in
    // the DOM — so "visible" is not enough, the tooltip has to be the element actually on top.
    cy.get("#space-sidebar .popover-tooltip-card").then(($card) => {
      const {left, top, width, height} = $card[0].getBoundingClientRect();
      cy.document().then((doc) => {
        const onTop = doc.elementFromPoint(left + width / 2, top + height / 2);
        expect($card[0].contains(onTop)).to.be.true;
      });
    });
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

    // The row is two lines tall; the icon centres on the title's line, not on the row's top edge.
    cy.get("#space_starred_list .content-link-container").then(($row) => {
      const icon = $row[0].querySelector(".object-icon").getBoundingClientRect();
      const title = $row[0].querySelector(".font-semibold").getBoundingClientRect();
      const centre = (box) => box.top + box.height / 2;
      expect(Math.round(centre(title) - centre(icon))).to.equal(0);
    });

    // The button fades in on hover like the tree row buttons, and Cypress cannot produce a real
    // CSS :hover state — so it reads as invisible and has to be clicked through.
    cy.get("#space_starred_list form button").click({force: true});

    cy.get("#space_starred_list a.content-link").should("not.exist");
    cy.contains("No starred items").should("be.visible");
  });

  it("adds and removes the row as the document's own star button is clicked", function () {
    // documents(:two) has a version fixture, so it renders in show mode with a star button —
    // a draft would redirect to /edit, which has none.
    cy.visit("/d/two");
    cy.get("#space-sidebar #starred").click();
    cy.contains("No starred items").should("be.visible");

    // The form keeps its dom_id across the star/unstar swap, so one selector covers both.
    cy.get("#favorite_document_two button").click();

    cy.get("#space_starred_list a.content-link[href='/d/two']").should("exist");
    cy.contains("No starred items").should("not.be.visible");

    cy.get("#favorite_document_two button").click();

    cy.get("#space_starred_list a.content-link").should("not.exist");
    cy.contains("No starred items").should("be.visible");
  });

  it("adds and removes the row as a table's own star button is clicked", function () {
    cy.appEval(`
      Table.create!(id: "startable", name: "Starrable Table", organization_id: "is",
                    space_id: "is_default", parent: Space.find("is_default")).id
    `);

    cy.visit("/t/startable");
    cy.get("#space-sidebar #starred").click();
    cy.contains("No starred items").should("be.visible");

    cy.get("#favorite_table_startable button").click();

    cy.get("#space_starred_list a.content-link[href='/t/startable']").should("exist");

    cy.get("#favorite_table_startable button").click();

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

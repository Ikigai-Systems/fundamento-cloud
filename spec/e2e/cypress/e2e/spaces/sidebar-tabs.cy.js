import {isOrganizationCookie} from "../../support/organization-cookies.js";
import {isTouch} from "../../support/device.js";
import {expectColorLabelKeepsLayout} from "../../support/color-label.js";

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

    cy.openSidebar().find("#spaces-dropdown").click();
    cy.openSidebar().find("[data-dropdown-target='menu']").should("be.visible");

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
    // Tooltips answer only a mouse, so a touch screen never shows one
    if (isTouch()) this.skip();

    cy.visit("/d/one");

    cy.get("#space-sidebar #hierarchy").should("not.contain.text", "Hierarchy");

    // A real mouse: the tooltip answers pointer events, and only from a mouse
    cy.get("#space-sidebar #starred [data-controller='tooltip']").realHover();

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

    cy.openSidebar().find("#starred").click();

    cy.wait("@starredTab");
    cy.contains("No starred items").should("be.visible");
  });

  it("adds and removes an item as it is starred and unstarred", function () {
    cy.visit("/d/one");
    cy.openSidebar().find("#starred").click();
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
    cy.openSidebar().find("#starred").click();
    cy.contains("No starred items").should("be.visible");

    // The form keeps its dom_id across the star/unstar swap, so one selector covers both.
    cy.closeSidebar();
    cy.get("#favorite_document_two button").click();

    cy.get("#space_starred_list a.content-link[href='/d/two']").should("exist");
    cy.openSidebar().contains("No starred items").should("not.be.visible");

    // The row arrives over the cable, which can beat the POST response that swaps the button
    // to "Remove star": clicking before the swap would star a second time instead of unstarring.
    cy.closeSidebar();
    cy.get("#favorite_document_two button[aria-label='Remove star']").should("exist");
    cy.get("#favorite_document_two button").click();

    cy.get("#space_starred_list a.content-link").should("not.exist");
    cy.openSidebar().contains("No starred items").should("be.visible");
  });

  it("adds and removes the row as a table's own star button is clicked", function () {
    cy.appEval(`
      Table.create!(id: "startable", name: "Starrable Table", organization_id: "is",
                    space_id: "is_default").id
    `);

    cy.visit("/t/startable");
    cy.openSidebar().find("#starred").click();
    cy.contains("No starred items").should("be.visible");

    cy.closeSidebar();
    cy.get("#favorite_table_startable button").click();

    cy.get("#space_starred_list a.content-link[href='/t/startable']").should("exist");
    // Wait for the button to swap to "Remove star" before clicking it again (see the document example).
    cy.get("#favorite_table_startable button[aria-label='Remove star']").should("exist");

    cy.get("#favorite_table_startable button").click();

    cy.get("#space_starred_list a.content-link").should("not.exist");
    cy.openSidebar().contains("No starred items").should("be.visible");
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
    cy.openSidebar().find("#starred").click();

    cy.get("#space_starred_list a.content-link[href='/d/one']").should("exist");
    cy.get("#space_starred_list").should("not.contain", "Other Space Doc");
  });

  it("navigates the content frame from a starred item without reloading the sidebar", function () {
    cy.appEval(`
      OrganizationMembership.find("om_is_pawel").favorites.create!(object: Document.find("two"))
    `);

    cy.visit("/d/one");
    cy.openSidebar().find("#starred").click();
    cy.get("#space_starred_list a.content-link[href='/d/two']").should("exist");

    cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

    cy.get("#space_starred_list a.content-link[href='/d/two']").click();

    cy.url().should("include", "/d/two");
    cy.get("@sidebarReload.all").should("have.length", 0);
    // The tab the user was on survives, because only the content frame navigated.
    cy.get("#space-sidebar #starred").should("have.attr", "aria-selected", "true");
  });

  it("keeps the content sidebar's tab across navigations", function () {
    cy.appEval(`
      Table.create!(id: "tabtable", name: "Tab Table", organization_id: "is", space_id: "is_default")
    `);

    cy.visit("/d/two");
    cy.openSidebar("details").find("#visitors").click();
    cy.get("#content-sidebar #visitors").should("have.attr", "aria-selected", "true");

    // A fresh page load rebuilds the sidebar, and so does opening a table
    cy.visit("/d/one");
    cy.openSidebar("details").find("#visitors").should("have.attr", "aria-selected", "true");

    cy.visit("/t/tabtable");
    cy.openSidebar("details").find("#visitors").should("have.attr", "aria-selected", "true");

    // A document-only tab is remembered too, and a table, which lacks it, falls back to the first
    cy.visit("/d/two");
    cy.openSidebar("details").find("#attachments").click();
    cy.visit("/t/tabtable");
    cy.openSidebar("details").find("#details").should("have.attr", "aria-selected", "true");
  });

  // Documents, tables and spaces share one tab-bar treatment: the same bar height, the same icon
  // size, and every icon centred in its tab. Each page is measured on its own, then compared.
  it("draws every sidebar tab bar with the same height, icon size and centring", function () {
    cy.appEval(`
      Table.create!(id: "tabtable", name: "Tab Table", organization_id: "is", space_id: "is_default")
    `);

    const measure = (win) => {
      const navs = [...win.document.querySelectorAll("nav[data-tabs-target='list']")]
        .filter((nav) => nav.getBoundingClientRect().height > 0);
      return navs.map((nav) => ({
        id: nav.closest("[id]")?.id,
        height: nav.getBoundingClientRect().height,
        tabs: [...nav.querySelectorAll("button")].map((button) => {
          const icon = button.querySelector(".tabs-tab-icon").getBoundingClientRect();
          const box = button.getBoundingClientRect();
          return {
            width: icon.width,
            height: icon.height,
            // Against the tab above its 2px underline: clientHeight leaves the border out
            offCentre: Math.abs(icon.top + icon.height / 2 - (box.top + button.clientHeight / 2)),
          };
        }),
      }));
    };

    const bars = [];
    ["/d/one", "/t/tabtable", "/s/is_default"].forEach((path) => {
      cy.visit(path);
      cy.get("nav[data-tabs-target='list'] .tabs-tab-icon").should("exist");
      cy.window().then((win) => bars.push(...measure(win)));
    });

    cy.then(() => {
      expect(bars.length, "tab bars measured").to.be.at.least(4);
      const first = bars[0];
      bars.forEach((bar) => {
        expect(bar.height, `${bar.id} bar height`).to.be.closeTo(first.height, 0.5);
        bar.tabs.forEach((tab) => {
          expect(tab.width, `${bar.id} icon width`).to.be.closeTo(first.tabs[0].width, 0.5);
          expect(tab.height, `${bar.id} icon height`).to.be.closeTo(first.tabs[0].height, 0.5);
          expect(tab.offCentre, `${bar.id} icon centre`).to.be.lessThan(1);
        });
      });
    });
  });

  describe("color labels", function () {
    const openHomeTab = (id) => () => {
      cy.visit("/");
      cy.get(`#${id}`).click();
    };

    it("underlines a starred item's title in its color without changing the row's height", function () {
      cy.appEval(`OrganizationMembership.find("om_is_pawel").favorites.create!(object: Document.find("one"))`);

      expectColorLabelKeepsLayout({
        record: `Document.find("one")`,
        visit: () => {
          cy.visit("/d/two");
          cy.openSidebar().find("#starred").click();
        },
        title: "#space_starred_list a[href='/d/one'] .font-semibold",
        box: "#space_starred_list a[href='/d/one']",
      });
    });

    it("underlines a child's title in the document's hierarchy chips without resizing the chip", function () {
      // A document with no versions opens in the editor, so the parent must be one that has a version.
      cy.appEval(`Space.find("is_default").update!(hierarchy: [{ "id" => "two", "children" => [{ "id" => "one", "children" => [] }] }])`);

      expectColorLabelKeepsLayout({
        record: `Document.find("one")`,
        visit: () => cy.visit("/d/two"),
        title: "#document_hierarchy a[href='/d/one']",
      });
    });

    it("underlines a favorite's title on the home page", function () {
      cy.appEval(`OrganizationMembership.find("om_is_pawel").favorites.create!(object: Document.find("one"))`);

      expectColorLabelKeepsLayout({
        record: `Document.find("one")`,
        visit: openHomeTab("favorites"),
        title: "#favorites_list [id^='favorite_'] .font-semibold",
        box: "#favorites_list [id^='favorite_']",
      });
    });

    it("underlines a recently updated item's title on the home page", function () {
      expectColorLabelKeepsLayout({
        record: `Document.find("one")`,
        visit: openHomeTab("recently-updated"),
        title: "#recently_updated_list #document_one .font-semibold",
        box: "#recently_updated_list #document_one",
      });
    });

    it("underlines the title of a document that mentions you on the home page", function () {
      cy.appEval(`
        ObjectReference.create!(
          organization_id: "is", source: Document.find("two"), target_type: "User",
          target_id: User.find_by!(email: "pawel@ikigai.systems").id, title: "Pawel", current: true,
          source_node_id: "550e8400-e29b-41d4-a716-446655440099"
        )
      `);

      expectColorLabelKeepsLayout({
        record: `Document.find("two")`,
        visit: openHomeTab("mentions"),
        title: "#mention_550e8400-e29b-41d4-a716-446655440099 .font-semibold",
        box: "#mention_550e8400-e29b-41d4-a716-446655440099",
      });
    });
  });

  describe("color picker in the Details tab", function () {
    const treeLabel = (id) => `#space-sidebar [data-document-id='${id}'] span.truncate`;
    const title = ".editable-content-title";
    const swatch = (name) => `#details_sidebar_tab [role='radio'][aria-label='${name}']`;

    // Both lazily loaded parts (the tree row and the Details frame) must exist before anything is
    // clicked: acting earlier races the frames connecting.
    function openDetails(path, id, pageTitle) {
      cy.visit(path);
      cy.get(treeLabel(id)).should("exist");
      cy.openSidebar("details").within(() => {
        cy.get('[aria-label="Details"]').click();
      });
      cy.get("#details_sidebar_tab [role='radiogroup']").should("be.visible");
      cy.get(title).should("contain.text", pageTitle);
    }

    function interceptUpdates() {
      cy.intercept("PATCH", /\/(d|t)\/[^/]+$/).as("update");
    }

    function markPage() {
      cy.window().then((win) => {
        win.__notReloaded = true;
      });
    }

    function expectNotReloaded() {
      cy.window().its("__notReloaded").should("eq", true);
    }

    it("choosing a color updates the sidebar tree row and the page title without a reload", function () {
      interceptUpdates();
      openDetails("/d/two", "two", "Two");
      markPage();

      cy.get(swatch("Indigo")).click();
      cy.wait("@update");

      cy.get(treeLabel("two")).should("have.attr", "data-color", "indigo").and("have.class", "color-label");
      cy.get(`${title} .color-label`).should("have.attr", "data-color", "indigo");
      cy.get(swatch("Indigo")).should("have.attr", "aria-checked", "true").find(".swatch-check").should("be.visible");
      cy.get(swatch("Blue")).should("have.attr", "aria-checked", "false");
      cy.get("#details_sidebar_tab [data-color-picker-target='name']").should("have.text", "Indigo").and("have.attr", "data-color", "indigo");
      expectNotReloaded();
    });

    it("choosing no color clears it", function () {
      cy.appEval(`Document.find("two").update!(color: "blue")`);
      interceptUpdates();
      openDetails("/d/two", "two", "Two");
      cy.get(treeLabel("two")).should("have.attr", "data-color", "blue");
      cy.get(swatch("Blue")).should("have.attr", "aria-checked", "true");
      markPage();

      cy.get(swatch("No color")).click();
      cy.wait("@update").its("request.body").should("deep.equal", {color: ""});

      cy.get(treeLabel("two")).should("not.have.attr", "data-color");
      cy.get(treeLabel("two")).should("not.have.class", "color-label");
      cy.get(`${title} .color-label`).should("not.exist");
      cy.get(swatch("No color")).should("have.attr", "aria-checked", "true");
      cy.get("#details_sidebar_tab [data-color-picker-target='name']").should("have.text", "None");
      cy.get("#details_sidebar_tab [data-color-picker-target='name']").should("not.have.attr", "data-color");
      expectNotReloaded();
      cy.appEval(`Document.find("two").color`).should("be.null");
    });

    it("moves between swatches with the arrow keys and chooses with Enter", function () {
      interceptUpdates();
      openDetails("/d/two", "two", "Two");

      cy.get(swatch("No color")).focus().type("{leftArrow}");
      cy.focused().should("have.attr", "aria-label", "Slate");
      cy.get(swatch("No color")).should("have.attr", "aria-checked", "true");

      cy.focused().type("{enter}");
      cy.wait("@update");
      cy.get(swatch("Slate")).should("have.attr", "aria-checked", "true");
      cy.get(treeLabel("two")).should("have.attr", "data-color", "slate");
    });

    it("shows a focus ring on every swatch it lands on, the checked one included", function () {
      openDetails("/d/two", "two", "Two");

      cy.get(swatch("Crimson")).focus();
      // Walking left from the first swatch wraps to "No color", which is the checked one here.
      ["No color", "Slate", "Magenta", "Indigo", "Blue", "Teal", "Lime", "Orange", "Crimson"].forEach((name) => {
        cy.realPress("ArrowLeft");
        cy.focused().should("have.attr", "aria-label", name).should(($swatch) => {
          const style = getComputedStyle($swatch[0]);
          // A white gap then a dark ring: not currentColor (white on the swatches) and not none.
          expect(style.boxShadow, `${name} focus ring`).to.contain("rgb(31, 41, 55)").and.to.contain("rgb(255, 255, 255)");
          if (name === "No color") expect($swatch.attr("aria-checked"), "checked and focused").to.equal("true");
        });
      });
    });

    it("returns the tab stop to the checked swatch when focus leaves the group", function () {
      cy.appEval(`Document.find("two").update!(color: "blue")`);
      openDetails("/d/two", "two", "Two");

      cy.get(swatch("Blue")).focus();
      cy.realPress("ArrowRight");
      cy.focused().should("have.attr", "aria-label", "Indigo");
      cy.realPress("Tab");
      cy.get("#details_sidebar_tab [role='radio'][tabindex='0']").should("have.length", 1).and("have.attr", "aria-label", "Blue");
    });

    // Also the persistence check: after the reload the final color is read back from the server.
    it("keeps the last of two quick choices, saving them in order", function () {
      let calls = 0;
      cy.intercept("PATCH", "/d/two", () => {
        calls += 1;
        // Hold only the first request back before it reaches the server: unserialized, the second
        // one overtakes it and the server ends on Teal.
        if (calls === 1) return new Promise((resolve) => setTimeout(resolve, 1500));
      }).as("update");
      openDetails("/d/two", "two", "Two");

      cy.get(swatch("Teal")).click();
      cy.get(swatch("Orange")).click();
      cy.wait("@update");
      cy.wait("@update");

      cy.get("@update.all").then((requests) => {
        expect(requests.map((request) => request.request.body)).to.deep.equal([{color: "teal"}, {color: "orange"}]);
      });
      cy.get(treeLabel("two")).should("have.attr", "data-color", "orange");
      cy.appEval(`Document.find("two").color`).should("eq", "orange");

      openDetails("/d/two", "two", "Two");
      cy.get(swatch("Orange")).should("have.attr", "aria-checked", "true");
      cy.get(treeLabel("two")).should("have.attr", "data-color", "orange");
    });

    it("a viewer cannot change the color", function () {
      cy.appEval(`
        Space.find("is_default").update!(access_mode: :restricted)
        Document.find("two").update!(color: "lime")
      `);
      cy.loginWithSession("stefan@ikigai.systems", "password", "stefan-session");
      cy.setCookie("organization_id", isOrganizationCookie);

      cy.visit("/d/two");
      cy.get(treeLabel("two")).should("exist");
      cy.openSidebar("details").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      cy.get("#details_sidebar_tab").contains("li", "Color").within(() => {
        cy.get("span[data-color='lime']").should("have.text", "Lime");
        cy.get("[role='radiogroup'], [role='radio'], button").should("not.exist");
      });
    });

    // The name is a flex item next to the heading, and a color label's padding-bottom would make
    // that row taller. Measures the row and where the name sits against the "Color" heading.
    function measureColorRow() {
      return cy.get("#details_sidebar_tab").contains("li", "Color").then(($row) => {
        const heading = $row.find("p")[0].getBoundingClientRect();
        const name = $row.find("span.text-sm\\/6")[0].getBoundingClientRect();
        return {height: $row[0].getBoundingClientRect().height, nameOffset: name.top - heading.top};
      });
    }

    it("keeps the Color row the same height and alignment once colored", function () {
      interceptUpdates();
      openDetails("/d/two", "two", "Two");
      measureColorRow().then((uncolored) => {
        cy.get(swatch("Teal")).click();
        cy.wait("@update");
        cy.get("#details_sidebar_tab [data-color-picker-target='name'].color-label").should("have.attr", "data-color", "teal");
        measureColorRow().should("deep.equal", uncolored);
      });
    });

    it("keeps the read-only Color row the same height and alignment once colored", function () {
      cy.appEval(`Space.find("is_default").update!(access_mode: :restricted)`);
      cy.loginWithSession("stefan@ikigai.systems", "password", "stefan-session");
      cy.setCookie("organization_id", isOrganizationCookie);
      const openReadOnlyDetails = () => {
        cy.visit("/d/two");
        cy.get(treeLabel("two")).should("exist");
        cy.openSidebar("details").within(() => {
          cy.get('[aria-label="Details"]').click();
        });
        cy.get("#details_sidebar_tab").contains("li", "Color").should("be.visible");
      };

      openReadOnlyDetails();
      cy.get("#details_sidebar_tab .color-label").should("not.exist");
      measureColorRow().then((uncolored) => {
        cy.appEval(`Document.find("two").update!(color: "lime")`);
        openReadOnlyDetails();
        cy.get("#details_sidebar_tab .color-label").should("have.attr", "data-color", "lime");
        measureColorRow().should("deep.equal", uncolored);
      });
    });

    it("changing the color does not alter the title and renaming does not clear the color", function () {
      interceptUpdates();
      openDetails("/d/two", "two", "Two");

      cy.get(swatch("Crimson")).click();
      cy.wait("@update");

      cy.get(title).click();
      cy.get(`${title} input`).clear().type("Renamed{enter}");
      cy.wait("@update");
      cy.get(`${title} .color-label`).should("have.text", "Renamed").and("have.attr", "data-color", "crimson");
      cy.get(treeLabel("two")).should("have.text", "Renamed").and("have.attr", "data-color", "crimson");
      cy.appEval(`Document.find("two").slice(:title, :color).values`).should("deep.equal", ["Renamed", "crimson"]);

      cy.get(swatch("Orange")).click();
      cy.wait("@update");
      cy.get(`${title} .color-label`).should("have.text", "Renamed").and("have.attr", "data-color", "orange");
      cy.appEval(`Document.find("two").title`).should("eq", "Renamed");
    });

    it("a failed save restores the previous selection and says why", function () {
      cy.appEval(`Document.find("two").update!(color: "blue")`);
      cy.intercept("PATCH", "/d/two", {
        statusCode: 422,
        body: {errors: {base: "Color must be one of: crimson, orange"}},
      }).as("failedUpdate");
      openDetails("/d/two", "two", "Two");
      cy.get(swatch("Blue")).should("have.attr", "aria-checked", "true");

      cy.get(swatch("Teal")).click();
      cy.wait("@failedUpdate");

      cy.get(swatch("Blue")).should("have.attr", "aria-checked", "true");
      cy.get(swatch("Teal")).should("have.attr", "aria-checked", "false");
      cy.get("#details_sidebar_tab [data-color-picker-target='name']").should("have.text", "Blue");
      cy.get(treeLabel("two")).should("have.attr", "data-color", "blue");
      cy.get("#flashes").should("contain", "Color must be one of");
    });

    it("sets a table's color in its Details tab, updating the tree row and the page title", function () {
      cy.appFixtures({fixtures_dir: "spec/fixtures", fixtures: ["tables/tables"]});
      interceptUpdates();
      openDetails("/t/orders", "orders", "Orders");
      markPage();

      cy.get(swatch("Lime")).click();
      cy.wait("@update").its("request.body").should("deep.equal", {color: "lime"});

      cy.get(treeLabel("orders")).should("have.attr", "data-color", "lime");
      cy.get(`${title} .color-label`).should("have.attr", "data-color", "lime");
      cy.appEval(`Table.find("orders").color`).should("eq", "lime");
      expectNotReloaded();
    });
  });
});

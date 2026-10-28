import {isOrganizationCookie} from "../../support/organization-cookies.js";
import {expectColorLabelKeepsLayout} from "../../support/color-label.js";

describe("Table Versions", function () {
  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "tables/tables",
        "tables/columns",
        "tables/rows",
        "tables/cells",
      ],
    });

    cy.loginWithSession();
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  // Versions are produced by a background job on a 5 minute window, which a browser test
  // cannot wait out; running the service inline is the same code path the job takes.
  const snapshot = (kind = "auto") =>
    cy.appEval(`Tables::VersionSnapshotService.new(Table.find("projects"), kind: :${kind}).call&.sequential_id`);

  it("records a version for edits made in the grid and lets you browse it", function () {
    snapshot("initial");

    cy.visit("/t/projects/edit");
    cy.get(".ikigai-rowstack-overrides").should("exist");
    cy.contains("Changes are saved automatically").should("be.visible");

    cy.intercept("PUT", "/t/projects/update_by_rowstack").as("updateTable");

    cy.contains('[role="gridcell"]', "JIRA").dblclick();
    cy.focused().clear().type("EDITED{enter}");
    cy.wait("@updateTable");

    snapshot();

    cy.visit("/t/projects/versions");
    cy.contains("History - ").should("be.visible");

    // Newest first: the edit, then the baseline it was made against. One cell, however
    // many keystrokes rowstack sent on the way there.
    cy.get("[data-testid='version-summary']").eq(0).should("contain", "1 cell");
    cy.get("[data-testid='version-summary']").eq(1).should("contain", "Baseline");
    cy.get("[data-testid='version-contributors']").eq(0).should("exist");
  });

  it("shows the historical content of a version", function () {
    snapshot("initial");

    cy.appEval(`
      Current.change_source = "ui"
      Table.find("projects").cells.find_by(value: "JIRA").update!(value: "AFTER")
      "OK"
    `);
    snapshot();

    cy.visit("/t/projects/versions/1");
    cy.get(".ikigai-rowstack-overrides").should("exist");
    cy.contains("JIRA").should("be.visible");
    cy.contains("AFTER").should("not.exist");

    cy.visit("/t/projects/versions/2");
    cy.get(".ikigai-rowstack-overrides").should("exist");
    cy.contains("AFTER").should("be.visible");
  });

  // A Tabler icon in running text must sit on the text's centre, not on its baseline.
  it("centres the history icon on the heading text of a version page", function () {
    snapshot("initial");
    cy.visit("/t/projects/versions/1");

    cy.contains("Historical versions").then(($heading) => {
      const icon = $heading.find("i[class*='icon-[tabler--history]']")[0];
      const range = document.createRange();
      range.selectNodeContents([...$heading[0].childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
      const text = range.getBoundingClientRect();
      const box = icon.getBoundingClientRect();
      expect(box.top + box.height / 2, "icon centre").to.be.closeTo(text.top + text.height / 2, 1);
    });
  });

  it("restores a version and keeps the state it replaced", function () {
    snapshot("initial");

    cy.appEval(`
      Current.change_source = "ui"
      Table.find("projects").cells.find_by(value: "JIRA").update!(value: "AFTER")
      "OK"
    `);
    snapshot();

    cy.visit("/t/projects/versions/1");
    cy.intercept("POST", "/t/projects/versions/1/restore").as("restore");
    cy.contains("Restore this version").click();
    cy.wait("@restore");

    cy.url().should("include", "/t/projects");
    cy.contains("JIRA").should("be.visible");
    cy.contains("AFTER").should("not.exist");

    // The replaced state is still reachable: nothing was lost by restoring.
    cy.visit("/t/projects/versions");
    cy.get("[data-testid='version-summary']").eq(0).should("contain", "Restored version 1");

    cy.visit("/t/projects/versions/2");
    cy.contains("AFTER").should("be.visible");
  });

  // The menu entry is always clickable, so a table with no versions has to land somewhere
  // that explains itself rather than on a 404.
  it("explains what will create the first version when there is none", function () {
    cy.visit("/t/projects");
    cy.get("#content_menu_button").click();
    cy.get("[role='menuitem']").contains("History").should("be.visible").click();

    cy.url().should("include", "/t/projects/versions");
    cy.get("[data-testid='no-versions-notice']").should("be.visible");
    cy.contains("No versions yet").should("be.visible");
    cy.contains("a few minutes after this table changes").should("be.visible");
  });

  it("underlines the table's title in a version page's heading without resizing it", function () {
    snapshot("initial");

    expectColorLabelKeepsLayout({
      record: `Table.find("projects")`,
      visit: () => cy.visit("/t/projects/versions"),
      title: "h1.text-4xl",
    });
  });
});

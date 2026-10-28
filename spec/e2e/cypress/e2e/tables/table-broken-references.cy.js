import {isOrganizationCookie} from "../../support/organization-cookies.js";
import {expectColorLabel, expectColorLabelKeepsLayout} from "../../support/color-label.js";

// People and documents cells store bare ids. When one no longer resolves, the cell
// shows the same lozenge a broken mention does in a document, never an error.
describe("Table cells referencing missing objects", function () {
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
      ]
    });

    // Stefan is a plain member, so a private space he doesn't belong to is closed to
    // him. Maria is not in this organization at all.
    cy.loginWithSession("stefan@ikigai.systems", "password", "stefan-session");
    cy.setCookie("organization_id", isOrganizationCookie);

    cy.appEval(`
      locked = Space.create!(id: "lockedroom", name: "Locked Room", organization_id: "is", access_mode: :private)
      Document.create!(id: "secretdoc", title: "Secret Checklist", organization_id: "is", space: locked)
      Document.create!(id: "trasheddoc", title: "Trashed Plan", organization_id: "is", space_id: "is_default").trash!

      table = Table.create!(id: "brokenrefs", name: "Broken References", organization_id: "is", space_id: "is_default")
      owner = table.columns.create!(id: "ownercol", name: "Owner", organization_id: "is", kind: :people)
      team = table.columns.create!(id: "teamcol", name: "Team", organization_id: "is", kind: :multi_people, previous_column_id: owner.id)
      docs = table.columns.create!(id: "docscol", name: "Docs", organization_id: "is", kind: :documents, previous_column_id: team.id)

      row = table.rows.create!(organization_id: "is")
      row.cells.create!(table: table, column: owner, organization_id: "is", value: "user_maria")
      row.cells.create!(table: table, column: team, organization_id: "is", value: "user_pawel,user_maria")
      row.cells.create!(table: table, column: docs, organization_id: "is", value: "one,trasheddoc,purgeddoc,secretdoc")
    `);
  });

  it("shows deleted and inaccessible references as lozenges", function () {
    cy.intercept("GET", "/users/user_maria*").as("missingUser");
    cy.intercept("GET", "/d/secretdoc*").as("restrictedDocument");

    cy.visit("/t/brokenrefs");
    cy.get(".ikigai-rowstack-overrides", { timeout: 10000 }).should("exist");

    // The single people cell: a lozenge in place of the name.
    cy.contains(".mention--broken", "Deleted user").should("be.visible");
    // The multi-people cell keeps to avatars, so the missing one is an icon.
    cy.get('.mention--broken[aria-label="Deleted user"]').should("be.visible");

    // A trashed document 404s exactly like a purged one.
    cy.get(".mention--broken").filter(':contains("Deleted document")').should("have.length", 2);
    cy.contains(".mention--restricted", "No access").should("be.visible");
    cy.contains("a", "One").should("have.attr", "href", "/d/one");

    // Neither the private document's title nor an error makes it to the page.
    cy.contains("Secret Checklist").should("not.exist");
    cy.contains("Unable to load").should("not.exist");

    // The lozenges are up, so every lookup has settled: a 4xx was asked for once,
    // not retried (which would have kept a spinner up for seconds).
    cy.get("@missingUser.all").should("have.length", 1);
    cy.get("@restrictedDocument.all").should("have.length", 1);
  });

  it("underlines a colored document in a document-link cell without resizing it", function () {
    expectColorLabelKeepsLayout({
      record: `Document.find("one")`,
      visit: () => {
        cy.visit("/t/brokenrefs");
        cy.get(".ikigai-rowstack-overrides", { timeout: 10000 }).should("exist");
        cy.contains("a", "One").should("have.attr", "href", "/d/one");
      },
      title: '.ikigai-rowstack-overrides a[href="/d/one"]',
    });
  });

  it("underlines a colored document in the cell's option list", function () {
    cy.appEval(`
      Document.find("two").update!(color: "indigo")
      Document.create!(id: "plaindoc", title: "Plain Doc", organization_id: "is", space_id: "is_default")
      table = Table.create!(id: "pickerdocs", name: "Picker Docs", organization_id: "is", space_id: "is_default")
      docs = table.columns.create!(id: "pickercol", name: "Pick", organization_id: "is", kind: :documents)
      table.rows.create!(organization_id: "is").cells.create!(table: table, column: docs, organization_id: "is", value: "one")
    `);

    // Only the edit page lets the cell open its picker, and Stefan, a plain member, can't edit.
    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
    cy.visit("/t/pickerdocs/edit");
    cy.get(".ikigai-rowstack-overrides", { timeout: 10000 }).should("exist");
    cy.get('[role=gridcell] a[href="/d/one"]').should("be.visible");

    // The first click focuses the cell, which then overlays it with a row of chips; a click on the
    // empty right side of that row opens the picker without following a document link.
    cy.get('[role=gridcell] a[href="/d/one"]').closest("[role=gridcell]").click("right");
    cy.get("[role=gridcell] .ring-2 .h-8").click("right");

    cy.get(".fundamento-react-select__option", { timeout: 10000 })
      .filter(":contains('Two')")
      .find(".color-label")
      .should(($label) => expectColorLabel($label, "indigo"));
    // A colored option is as tall as an uncolored one.
    cy.get(".fundamento-react-select__option").filter(":contains('Plain Doc')").then(($plain) => {
      cy.get(".fundamento-react-select__option").filter(":contains('Two')").should(($colored) => {
        expect($colored[0].getBoundingClientRect().height, "option height").to.equal($plain[0].getBoundingClientRect().height);
      });
    });
  });

  it("keeps a colored selected document chip as tall as a plain one in the open picker", function () {
    cy.appEval(`
      Document.find("two").update!(color: "indigo")
      table = Table.create!(id: "chipdocs", name: "Chip Docs", organization_id: "is", space_id: "is_default")
      docs = table.columns.create!(id: "chipcol", name: "Pick", organization_id: "is", kind: :documents)
      table.rows.create!(organization_id: "is").cells.create!(table: table, column: docs, organization_id: "is", value: "one,two")
    `);

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
    cy.visit("/t/chipdocs/edit");
    cy.get('[role=gridcell] a[href="/d/one"]').should("be.visible");

    cy.get('[role=gridcell] a[href="/d/one"]').closest("[role=gridcell]").click("right");
    cy.get("[role=gridcell] .ring-2 .h-8").click("right");

    cy.get(".fundamento-react-select__multi-value").filter(":contains('Two')")
      .find(".color-label").should(($label) => expectColorLabel($label, "indigo"));
    cy.get(".fundamento-react-select__multi-value").filter(":contains('One')").then(($plain) => {
      cy.get(".fundamento-react-select__multi-value").filter(":contains('Two')").should(($colored) => {
        expect($colored[0].getBoundingClientRect().height, "chip height").to.equal($plain[0].getBoundingClientRect().height);
      });
    });
  });
});

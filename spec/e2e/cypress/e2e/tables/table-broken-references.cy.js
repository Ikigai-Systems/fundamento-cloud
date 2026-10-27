import {isOrganizationCookie} from "../../support/organization-cookies.js";

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
});

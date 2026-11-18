import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Table duration column", function () {
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
        "versions",
        "tables/tables",
        "tables/columns",
        "tables/rows",
        "tables/cells",
      ],
    });

    // The Start + Duration = End table from a project plan. Start is stored as YYYY-MM-DD.
    cy.appEval([
      "table = Table.find('orders')",
      "start = table.columns.create!(name: 'Start', organization_id: 'is', kind: :date, previous_column_id: 'orders_who', configuration: { 'dateStoredFormat' => 3 })",
      "length = table.columns.create!(name: 'Length', organization_id: 'is', kind: :duration, previous_column: start)",
      "table.columns.create!(name: 'End', organization_id: 'is', kind: :formula, previous_column: length, formula: 'CurrentRow(\"Start\") + CurrentRow(\"Length\")', configuration: { 'dateStoredFormat' => 3 })",
      "table.cells.create!(organization_id: 'is', row_id: 'orders_row_1', column: start, value: '2024-01-31')",
      "table.cells.create!(organization_id: 'is', row_id: 'orders_row_1', column: length, value: '2 days')",
      "'OK'",
    ].join("\n"));

    cy.loginWithSession();

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("adds the duration to the start date in the formula column", function () {
    cy.visit("/t/orders/edit");

    cy.get(".ikigai-rowstack-overrides").should("exist");
    cy.contains("Changes are saved automatically").should("be.visible");

    cy.contains('[role="gridcell"]', "2 days").should("exist");
    cy.contains('[role="gridcell"]', "2024-02-02").should("exist");
  });

  it("normalizes what is typed into a duration cell", function () {
    cy.visit("/t/orders/edit");

    cy.get(".ikigai-rowstack-overrides").should("exist");
    cy.contains("Changes are saved automatically").should("be.visible");

    cy.contains('[role="gridcell"]', "2 days").dblclick();
    cy.focused().type("{selectall}1d3h");

    // Leaving the cell commits and normalizes the text
    cy.contains('[role="gridcell"]', "01/31/2024").click();
    cy.contains('[role="gridcell"]', "1 day 3 hrs").should("exist");

    const waitForPersistence = (attempt = 0) => {
      return cy.appEval(
        "Tables::Cell.joins(:column).find_by(row_id: 'orders_row_1', table_columns: { name: 'Length' })&.value"
      ).then((value) => {
        if (value === "1 day 3 hrs" || attempt >= 20) {
          expect(value).to.eq("1 day 3 hrs");
        } else {
          cy.wait(500);
          return waitForPersistence(attempt + 1);
        }
      });
    };
    waitForPersistence();
  });
});

import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Table Button Refresh", function () {
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

    // Create a button column on the Orders table with the toggle formula.
    // The formula adds the current user's ID to the "Who" field if not present,
    // or removes it if already present (toggle behavior).
    // Uses Ruby %q[...] for the formula string to avoid quote escaping issues.
    cy.appEval([
      "table = Table.find('orders')",
      "table.columns.create!(",
      "  name: 'Vote',",
      "  organization_id: 'is',",
      "  kind: :button,",
      "  previous_column_id: 'orders_who',",
      "  configuration: {",
      "    'buttonFormula' => %q[UpdateRows(\"Orders\", CurrentRow(\"id\") == [ThisRow], \"Who\", If(IndexOf(String(Dig(User(), \"id\")), Split(CurrentRow(\"Who\"), \",\")) != Number(\"-1\"), Join(\",\", Splice(Split(CurrentRow(\"Who\"), \",\"), IndexOf(String(Dig(User(), \"id\")), Split(CurrentRow(\"Who\"), \",\")), 1)), Join(\",\", Filter(Split(CurrentRow(\"Who\"), \",\"), CurrentValue != \"\"), String(Dig(User(), \"id\")))))],",
      "    'buttonLabel' => 'Add / Remove me'",
      "  }",
      ")",
      "'OK'",
    ].join("\n"));

    cy.loginWithSession();

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("refreshes the table after a button click modifies data", function () {
    cy.visit("/t/orders/edit");

    // Wait for table to load
    cy.get(".ikigai-rowstack-overrides").should("exist");
    cy.contains("Changes are saved automatically").should("be.visible");

    // Verify initial state: Hawaii row has "Who" = "user_stefan"
    cy.contains("Hawaii").should("exist");
    cy.contains("user_stefan").should("exist");

    // Intercept the formula eval API call
    cy.intercept("POST", "/formulas/eval").as("formulaEval");

    // Click the "Add / Remove me" button in the Hawaii row
    cy.contains("Add / Remove me").click();

    // Wait for the formula to evaluate successfully
    cy.wait("@formulaEval").then((interception) => {
      expect(interception.response.statusCode).to.eq(200);

      // Verify the backend returned commands (the update was executed)
      const body = interception.response.body;
      expect(body).to.have.property("commands");
      expect(body.commands).to.have.length.greaterThan(0);
    });

    // Verify the database was actually updated
    cy.appEval(
      "Tables::Cell.find_by(row_id: 'orders_row_1', column_id: 'orders_who').value"
    ).then((dbValue) => {
      expect(dbValue).to.include("user_pawel");
    });

    // THE BUG: The table should refresh and show the updated value
    // without needing a page reload. This assertion will fail if
    // the table doesn't auto-refresh after the button formula executes.
    cy.contains('[role="gridcell"]', "user_pawel").should("exist");
  });

  describe("buttons that rename or recolor", function () {
    const title = ".editable-content-title";
    const sidebarLabel = (id) => `#space-sidebar [data-document-id='${id}'] span.truncate`;
    const swatch = (name) => `#details_sidebar_tab [role='radio'][aria-label='${name}']`;

    beforeEach(() => {
      cy.appEval(`Space.find("is_default").update!(hierarchy: [{ "id" => "two", "children" => [] }]); "OK"`);
    });

    function addButton(label, formula) {
      cy.appEval([
        "table = Table.find('orders')",
        "table.columns.create!(",
        "  name: 'Rename',",
        "  organization_id: 'is',",
        "  kind: :button,",
        "  previous_column_id: table.columns.find_by(name: 'Vote').id,",
        "  configuration: { 'buttonFormula' => %q[" + formula + "], 'buttonLabel' => '" + label + "' }",
        ")",
        "'OK'",
      ].join("\n"));
    }

    it("updates the page title, the sidebar and the Details color picker without a reload", function () {
      addButton("Make teal", 'UpdateTable("Orders", "name", "Orders renamed", "color", "teal")');
      cy.visit("/t/orders/edit");
      cy.get(sidebarLabel("orders")).should("contain.text", "Orders");
      cy.openSidebar("details").within(() => {
        cy.get('[aria-label="Details"]').click();
      });
      cy.get("#details_sidebar_tab [role='radiogroup']").should("be.visible");
      cy.get(swatch("Teal")).should("have.attr", "aria-checked", "false");
      cy.window().then((win) => { win.__notReloaded = true; });

      cy.contains("Make teal").click();

      cy.get(title).should("contain.text", "Orders renamed");
      cy.get(`${title} .color-label`).should("have.attr", "data-color", "teal");
      cy.get(sidebarLabel("orders")).should("contain.text", "Orders renamed").and("have.attr", "data-color", "teal");
      cy.get(swatch("Teal")).should("have.attr", "aria-checked", "true");
      cy.window().its("__notReloaded").should("eq", true);
    });

    it("updates a document's sidebar row when a button renames and recolors it", function () {
      addButton("Mark two", 'UpdateDocument("two", "title", "Two renamed", "color", "indigo")');
      cy.visit("/t/orders/edit");
      cy.get(sidebarLabel("two")).should("contain.text", "Two");

      cy.contains("Mark two").click();

      cy.get(sidebarLabel("two")).should("contain.text", "Two renamed").and("have.attr", "data-color", "indigo");
    });
  });
});

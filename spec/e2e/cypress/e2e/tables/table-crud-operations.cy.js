describe("Table CRUD Operations", function() {
  beforeEach(() => {
    cy.app("clean");

    // Load fixtures with tables, columns, rows, and cells
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "tables/tables",
        "tables/columns",
        "tables/rows",
        "tables/cells"
      ]
    });

    cy.login("pawel@ikigai.systems", "password");

    // Select an organization (Ikigai Systems)
    cy.contains("tr", "Ikigai Systems").within(() => {
      cy.contains("Switch to").click();
    });
  });

  it("displays a table in view mode correctly", function() {
    // Get the table NPI and visit it using the cy.appEval command
    cy.appEval("Table.find_by(name: 'projects').id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      // Verify the page loads successfully
      cy.contains("projects").should("exist");

      // Verify the Edit button is present
      cy.get(".edit-table-button").should("exist");

      // Verify table content is rendered using Rowstack
      cy.get(".ikigai-rowstack-overrides").should("exist");

      // Verify column headers are visible (scrollIntoView for clipped elements)
      cy.contains("Key").scrollIntoView().should("be.visible");

      // Verify row data is visible - check for key values
      cy.contains("JIRA").should("exist");
      cy.contains("CONFLUENCE").should("exist");
      cy.contains("MON").should("exist");
    });
  });

  it("allows editing a table and updating cell values", function() {
    cy.appEval("Table.find_by(name: 'projects').id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      // Click the Edit button
      cy.get(".edit-table-button").click();

      // Verify we're now on the edit page (URL includes table name prefix like "projects~...")
      cy.url().should("include", "/edit");

      // Wait for autosave message to appear, which indicates edit mode is ready
      cy.contains("Each change is saved automatically").should("be.visible");

      // Verify table is in edit mode with Rowstack
      cy.get(".ikigai-rowstack-overrides").should("exist");

      // Verify cells are interactive (have gridcell role)
      cy.get('[role="gridcell"]').should("have.length.at.least", 1);

      // Verify the table has the expected data
      cy.contains("JIRA").should("exist");
      cy.contains("CONFLUENCE").should("exist");
      cy.contains("MON").should("exist");

      // Verify the "New row" button is visible
      cy.contains("New row").should("be.visible");
    });
  });

  it("allows adding a new row to the table", function() {
    cy.appEval("Table.find_by(name: 'projects').id").then((tableId) => {
      cy.visit(`/t/${tableId}/edit`);

      // Wait for table to load by checking for the Rowstack container and autosave message
      cy.get(".ikigai-rowstack-overrides").should("exist");
      cy.contains("Each change is saved automatically").should("be.visible");

      // Count initial rows in the database
      cy.appEval("Table.find_by(name: 'projects').rows.count").then((initialCount) => {
        // Capture the current row count text
        const initialRowText = `${initialCount} rows`;
        cy.contains(initialRowText).should("be.visible");

        // Find and click the "+ New row" button
        cy.contains("New row").click();

        // Wait for the UI to reflect the new row count
        const newRowText = `${initialCount + 1} rows`;
        cy.contains(newRowText).should("be.visible");

        // Verify row count increased in the database
        cy.appEval("Table.find_by(name: 'projects').rows.count").then((newCount) => {
          expect(newCount).to.equal(initialCount + 1);
        });
      });
    });
  });

  it("persists changes after navigating away and back", function() {
    cy.appEval("Table.find_by(name: 'projects').id").then((tableId) => {
      cy.visit(`/t/${tableId}/edit`);

      // Wait for table to load
      cy.get(".ikigai-rowstack-overrides").should("exist");
      cy.contains("Each change is saved automatically").should("be.visible");

      // Verify original value exists
      cy.contains('[role="gridcell"]', "MON").should("exist");

      // Edit a cell - double click to enter edit mode
      cy.contains('[role="gridcell"]', "MON").dblclick();

      // Type new value and blur to commit the edit
      cy.focused().should("exist");
      cy.focused().type("{selectall}MON-UPDATED").blur();

      // Click on a different cell to fully deselect the edited cell
      cy.contains('[role="gridcell"]', "JIRA").click();

      // Wait for the new value to appear (indicating save is complete)
      cy.contains("MON-UPDATED").should("exist");

      // Navigate to view mode
      cy.visit(`/t/${tableId}`);

      // Wait for view mode to load
      cy.get(".ikigai-rowstack-overrides").should("exist");

      // Verify the change persists in view mode
      cy.contains("MON-UPDATED").should("exist");

      // Navigate back to edit mode
      cy.visit(`/t/${tableId}/edit`);

      // Wait for edit mode to load
      cy.contains("Each change is saved automatically").should("be.visible");

      // Verify the change still exists in edit mode
      cy.contains('[role="gridcell"]', "MON-UPDATED").should("exist");
    });
  });

  it("displays correct table data structure", function() {
    cy.appEval("Table.find_by(name: 'projects').id").then((tableId) => {
      cy.visit(`/t/${tableId}`);

      // Verify the ViewTablePanel is rendered
      cy.get("article.document").should("exist");

      // Verify content menu has the Edit button
      cy.get(".edit-table-button").should("exist");
      cy.get(".edit-table-button").should("contain", "Edit");

      // Request the table data via API to verify structure
      cy.request({
        url: `/t/${tableId}.json`,
        headers: {
          "Accept": "application/json"
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("table");
        expect(response.body).to.have.property("data");

        // Verify table structure
        const {table, data} = response.body;
        expect(table).to.have.property("id");
        expect(table.name).to.eq("projects");

        // Verify data structure
        expect(data).to.have.property("columns");
        expect(data).to.have.property("rows");
        expect(data.columns).to.have.length(4); // Key, Name, Description, Value
        expect(data.rows).to.have.length(3); // 3 project rows

        // Verify column names
        const columnNames = data.columns.map(col => col.name);
        expect(columnNames).to.include("Key");
        expect(columnNames).to.include("Name");
        expect(columnNames).to.include("Description");
        expect(columnNames).to.include("Value");
      });
    });
  });
});

import {isOrganizationCookie} from "../../support/organization-cookies.js";

const editPageUrl = /\/d\/[_\-a-zA-Z0-9]+\/edit$/;

// The chart block is the only consumer of apexcharts / react-apexcharts, and nothing
// else in the suite renders one. Without this spec an apexcharts major bump goes green
// on CI while charts are broken in the product (see PR #190).
//
// Most cases seed a fully configured chartBlock into the document content rather than
// clicking one together. That is deliberate: it pins the rendering contract -- given
// these props and this table, apexcharts must produce this SVG -- which is exactly what
// a dependency bump breaks, and it keeps the assertions independent of the editor's
// insertion flow.
describe("Charts in Document", function () {
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
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);

    // A dedicated data source with plain numeric values. The shared table fixtures put
    // formula-ish strings ("3*5") in their numeric-looking columns, which the API
    // evaluates -- not something to assert chart series against.
    cy.appEval(`
      table = Table.create!(
        id: "revenuetbl", name: "Revenue", organization_id: "is", space_id: "is_default"
      )
      month = table.columns.create!(
        id: "revenuemonth", name: "Month", organization_id: "is", kind: :string
      )
      amount = table.columns.create!(
        id: "revenueamount", name: "Amount", organization_id: "is", kind: :number,
        previous_column_id: month.id
      )

      previous = nil
      [["January", 120], ["February", 340], ["March", 275]].each do |label, value|
        row = table.rows.create!(organization_id: "is", previous_row_id: previous&.id)
        row.cells.create!(table: table, column: month, organization_id: "is", value: label)
        row.cells.create!(table: table, column: amount, organization_id: "is", value: value.to_s)
        previous = row
      end
    `);
  });

  // Each seeded document gets its own id. The editor keeps a Y.Doc per document in
  // IndexedDB, which survives cy.app("clean") -- reusing one id makes a test hydrate the
  // previous test's chart instead of the one just seeded.
  let seedCounter = 0;
  let seededDocId = null;

  // Builds a document whose content is a single chartBlock with the given props.
  // BlocknoteConverterService round-trips custom block types with their props intact.
  function seedChartDocument(props = {}) {
    seededDocId = `chartdoc${++seedCounter}`;
    const chartProps = {
      tableNpi: "revenuetbl",
      title: "Revenue chart",
      chartType: "line",
      xAxisColumnNpi: "revenuemonth",
      yAxisColumnNpi: "revenueamount",
      ...props,
    };

    cy.appEval(`
      doc = Document.create!(
        id: "${seededDocId}", title: "Chart Doc", organization_id: "is", space_id: "is_default"
      )
      blocks = [{
        "id" => "chartblk1",
        "type" => "chartBlock",
        "props" => ${JSON.stringify(chartProps)},
        "content" => [],
        "children" => []
      }]
      doc.content_or_build.update!(sync: BlocknoteConverterService.blocks_to_yjs(blocks))
      doc.reload.content.sync&.bytesize.to_i
    `).then((bytes) => {
      // blocks_to_yjs shells out to the converter; a silent failure here would surface
      // later as a confusing "chart never rendered".
      expect(bytes, "seeded document content size").to.be.greaterThan(0);
    });
  }

  function openSeededChart() {
    cy.visit(`/d/${seededDocId}/edit`);
    cy.waitForEditor();
    cy.get("[data-content-type='chartBlock']", {timeout: 10000}).should("exist");
  }

  // The axis and chart type pickers are SelectButtons: a role=combobox trigger next to
  // the label, with options rendered into a floating portal. Scope the option lookup to
  // the open listbox -- several role=option elements live in the page at once.
  function chooseFromPicker(label, optionLabel) {
    cy.contains("label", label).siblings("[role=combobox]").click();
    cy.get("[role=listbox]:visible").find("[role=option]").contains(optionLabel).first().click();
  }

  describe("inserting a chart", function () {
    function insertChartBlock() {
      cy.visit("/s/is_default");
      cy.get('[aria-label="Create new document"]').click();

      cy.url().should("match", editPageUrl);
      cy.waitForEditor();

      cy.get("[data-document-editor] [role=\"textbox\"]").first().click();
      cy.focused().type("/chart");

      cy.get(".bn-suggestion-menu").should("be.visible");
      cy.get(".bn-suggestion-menu-item").contains("Chart").click();
    }

    it("inserts a chart block that asks for a data source table", function () {
      insertChartBlock();

      cy.contains("New chart").should("be.visible");
      cy.contains("Data source table").should("be.visible");
      cy.get(".fundamento-react-select-container").should("exist");

      // Nothing is charted before a table is chosen.
      cy.get(".apexcharts-canvas").should("not.exist");
    });

    it("names the chart after the table and offers the axis pickers", function () {
      insertChartBlock();
      cy.contains("New chart").should("be.visible");

      cy.get(".fundamento-react-select-container").first().click();
      cy.get(".fundamento-react-select__option", {timeout: 10000})
        .filter(":contains('Revenue')")
        .first()
        .click();

      // The title is an <input> while the editor is editable, so assert its value.
      cy.get("[data-content-type='chartBlock'] input[type='text']")
        .should("have.value", "Chart for Revenue");

      cy.contains("label", "X axis").should("be.visible");
      cy.contains("label", "Y axis").should("be.visible");
      cy.contains("label", "Chart type").should("be.visible");

      // Axes are unset, so the placeholder stands in for the chart.
      cy.contains("Select chart axes...").should("be.visible");
      cy.get(".apexcharts-canvas").should("not.exist");
    });

    it("charts the table once both axes are picked", function () {
      insertChartBlock();
      cy.contains("New chart").should("be.visible");

      cy.get(".fundamento-react-select-container").first().click();
      cy.get(".fundamento-react-select__option", {timeout: 10000})
        .filter(":contains('Revenue')")
        .first()
        .click();
      cy.contains("label", "X axis", {timeout: 10000}).should("be.visible");

      // The axis pickers take their option values from the column identifier the API
      // sends. When that lookup is wrong they hand back undefined, the block prop never
      // changes, and the placeholder stays up -- which is what this asserts against.
      chooseFromPicker("X axis", "Month");
      chooseFromPicker("Y axis", "Amount");

      cy.contains("Select chart axes...").should("not.exist");
      cy.get(".apexcharts-canvas", {timeout: 15000}).should("be.visible");
      cy.get(".apexcharts-xaxis-texts-g").should("contain", "January");
      cy.get(".apexcharts-line-series .apexcharts-series").should("have.length", 1);

      // The series is named after the Y column, via the same column lookup. Line charts
      // render no visible legend, but apexcharts puts the series name in the SVG's
      // accessible name.
      cy.get(".apexcharts-canvas svg")
        .should("have.attr", "aria-label", "line chart with 1 data series: Amount");
    });
  });

  describe("rendering", function () {
    it("renders an apexcharts line chart from the table data", function () {
      seedChartDocument();
      openSeededChart();

      // The assertion that actually exercises apexcharts: a real SVG chart carrying the
      // x-axis categories and one series, both taken from the table.
      cy.get(".apexcharts-canvas", {timeout: 15000}).should("be.visible");
      cy.get(".apexcharts-canvas svg").should("exist");

      cy.get(".apexcharts-xaxis-texts-g").should("contain", "January");
      cy.get(".apexcharts-xaxis-texts-g").should("contain", "February");
      cy.get(".apexcharts-xaxis-texts-g").should("contain", "March");

      cy.get(".apexcharts-line-series .apexcharts-series").should("have.length", 1);

      // The series takes its name from the Y column.
      cy.get(".apexcharts-canvas svg")
        .should("have.attr", "aria-label", "line chart with 1 data series: Amount");

      cy.contains("Select chart axes...").should("not.exist");
    });

    it("renders a bar chart", function () {
      seedChartDocument({chartType: "bar"});
      openSeededChart();

      cy.get(".apexcharts-bar-series", {timeout: 15000}).should("exist");
      cy.get(".apexcharts-bar-series .apexcharts-series").should("have.length", 1);
      cy.get(".apexcharts-xaxis-texts-g").should("contain", "January");
    });

    it("renders a pie chart, which builds its series a different way", function () {
      // Unlike line/bar/area/radar, the pie branch passes a bare number[] as the series
      // and moves the x values into `labels`.
      seedChartDocument({chartType: "pie"});
      openSeededChart();

      cy.get(".apexcharts-pie", {timeout: 15000}).should("exist");
      cy.get(".apexcharts-pie-series").should("have.length", 3);
      cy.get(".apexcharts-legend").should("contain", "January");
      cy.get(".apexcharts-legend").should("contain", "March");
    });

    it("shows the placeholder when the axes are not configured", function () {
      seedChartDocument({xAxisColumnNpi: "", yAxisColumnNpi: ""});
      openSeededChart();

      cy.contains("Select chart axes...").should("be.visible");
      cy.get(".apexcharts-canvas").should("not.exist");
    });

    it("reports a data source table it cannot load", function () {
      seedChartDocument({tableNpi: "missingtbl"});
      openSeededChart();

      cy.contains("Unable to load table with id missingtbl", {timeout: 15000})
        .should("be.visible");
      cy.get(".apexcharts-canvas").should("not.exist");
    });
  });

  describe("interacting with a saved chart", function () {
    it("switches the rendered chart type", function () {
      seedChartDocument();
      openSeededChart();
      cy.get(".apexcharts-line-series", {timeout: 15000}).should("exist");

      chooseFromPicker("Chart type", "bar");

      // ChartBlock keys the chart on chartType to force a full remount, so the previous
      // series markup must be gone rather than layered under the new one.
      cy.get(".apexcharts-bar-series", {timeout: 15000}).should("exist");
      cy.get(".apexcharts-line-series").should("not.exist");
      cy.get(".apexcharts-xaxis-texts-g").should("contain", "February");
    });

    it("persists a chart type change across save and reload", function () {
      seedChartDocument();
      openSeededChart();
      cy.get(".apexcharts-line-series", {timeout: 15000}).should("exist");

      chooseFromPicker("Chart type", "bar");
      cy.get(".apexcharts-bar-series", {timeout: 15000}).should("exist");

      // Per .claude/rules/e2e-tests.md the flash lives outside the swapped frame, so a
      // stale "Document has been updated" can match. The POST is the sync point.
      cy.intercept("POST", "/d/*/versions").as("saveVersion");
      cy.get('[aria-label="Save document"]').click();
      cy.wait("@saveVersion");

      cy.reload();
      cy.waitForEditor();

      cy.get(".apexcharts-bar-series", {timeout: 15000}).should("exist");
      cy.get(".apexcharts-line-series").should("not.exist");
    });
  });

  describe("read-only mode", function () {
    it("shows static axis and type values instead of pickers", function () {
      seedChartDocument();
      openSeededChart();
      cy.get(".apexcharts-canvas", {timeout: 15000}).should("be.visible");

      // The read-only view renders a Version, so the document has to be saved through
      // the editor once before there is anything to show there.
      cy.intercept("POST", "/d/*/versions").as("saveVersion");
      cy.get('[aria-label="Save document"]').click();
      cy.wait("@saveVersion");

      cy.visit(`/d/${seededDocId}`);
      cy.waitForEditor();

      // The chart still renders, but every picker is replaced by a plain value.
      cy.get(".apexcharts-canvas", {timeout: 15000}).should("be.visible");
      cy.get("[data-content-type='chartBlock'] [role=combobox]").should("not.exist");
      cy.get("[data-content-type='chartBlock'] input[type='text']").should("not.exist");

      cy.contains("label", "X axis").parent().should("contain", "Month");
      cy.contains("label", "Y axis").parent().should("contain", "Amount");
      cy.contains("label", "Chart type").parent().should("contain", "line");
      cy.get("[data-content-type='chartBlock']").should("contain", "Revenue chart");
    });
  });
});

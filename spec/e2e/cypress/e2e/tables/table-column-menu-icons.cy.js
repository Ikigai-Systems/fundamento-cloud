// The column header menu mixes icons drawn by rowstack (inline SVG) with icons the app adds
// (Tabler mask classes). They must read as one set: the same box, centred on their labels.
describe("Table column menu icons", function () {
  const columns = [
    ["Name", "string"],
    ["Due", "date"],
    ["Starts", "datetime"],
    ["Amount", "number"],
    ["Doubled", "formula"],
    ["Go", "button"]
  ];

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
        "tables/tables",
        "tables/columns",
        "tables/rows",
        "tables/cells"
      ]
    });
    cy.login("pawel@ikigai.systems", "password");
    cy.visit("/");
    cy.contains("tr", "Ikigai Systems").within(() => {
      cy.contains("Switch to").click();
    });
  });

  function labelRect(item) {
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const range = document.createRange();
    range.selectNodeContents(walker.nextNode());
    return range.getBoundingClientRect();
  }

  function expectAlignedMenuIcons(column) {
    cy.get(".ikigai-rowstack-overrides .shadow-md").should("contain", "Delete").then(($menu) => {
      const icons = $menu[0].querySelectorAll("svg, [class*='icon-[tabler--']");
      expect(icons.length, `${column} menu icons`).to.be.greaterThan(3);
      const first = icons[0].getBoundingClientRect();

      for (const icon of icons) {
        const item = icon.parentElement;
        const name = `${column} menu: ${item.textContent.trim()}`;
        const box = icon.getBoundingClientRect();
        const label = labelRect(item);
        expect(box.width, `${name} icon width`).to.equal(first.width);
        expect(box.height, `${name} icon height`).to.equal(first.height);
        expect(
          Math.abs(box.top + box.height / 2 - (label.top + label.height / 2)),
          `${name} icon centred on its label`
        ).to.be.at.most(1);
      }
    });
  }

  it("draws every icon of a column header menu at one size, centred on its label", function () {
    cy.appEval(`
      projects = Table.find(:projects)
      table = Table.create!(name: "Menu icons", space: projects.space, organization: projects.organization)
      previous = nil
      ${JSON.stringify(columns)}.each do |name, kind|
        previous = Tables::Column.create!(table: table, name: name, kind: kind, previous_column: previous,
          organization: projects.organization)
      end
      table.columns.find_by(kind: "formula").update!(formula: "1 + 2")
      table.id
    `).then((tableId) => {
      cy.visit(`/t/${tableId}`);
      cy.get(".edit-table-button").click();
      cy.contains("Changes are saved automatically").should("be.visible");

      for (const [name] of columns) {
        cy.contains(".ikigai-rowstack-overrides span", new RegExp(`^${name}$`)).scrollIntoView().click();
        expectAlignedMenuIcons(name);
        cy.get("body").type("{esc}");
        cy.get(".ikigai-rowstack-overrides .shadow-md").should("not.exist");
      }
    });
  });
});

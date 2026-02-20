import {convertBlocksToMarkdown, convertMarkdownToBlocks} from "../src/converters";

describe("Custom block markdown round-trip", () => {
  describe("advancedTable", () => {
    const advancedTableBlock = {
      id: "table1",
      type: "advancedTable",
      props: {
        tableId: 42,
        tableNpi: "abc123",
        viewProps: JSON.stringify({columns: {}}),
      },
      content: undefined,
      children: [],
    };

    it("should preserve advancedTable block type through round-trip", async () => {
      const markdown = await convertBlocksToMarkdown([advancedTableBlock]);
      const blocks = await convertMarkdownToBlocks(markdown);

      const table = blocks.find((b: any) => b.type === "advancedTable");
      expect(table).toBeDefined();
    });

    it("should preserve advancedTable props through round-trip", async () => {
      const markdown = await convertBlocksToMarkdown([advancedTableBlock]);
      const blocks = await convertMarkdownToBlocks(markdown);

      const table = blocks.find((b: any) => b.type === "advancedTable");
      expect(table.props.tableId).toBe(42);
      expect(table.props.tableNpi).toBe("abc123");
    });

    it("should emit raw HTML containing data-content-type in markdown", async () => {
      const markdown = await convertBlocksToMarkdown([advancedTableBlock]);

      expect(markdown).toContain("data-content-type=\"advancedTable\"");
      expect(markdown).toContain("data-table-npi=\"abc123\"");
      expect(markdown).toContain("data-table-id=\"42\"");
    });
  });

  describe("chartBlock", () => {
    const chartBlock = {
      id: "chart1",
      type: "chartBlock",
      props: {
        tableNpi: "tbl999",
        title: "Revenue",
        chartType: "bar",
        xAxisColumnNpi: "col1",
        yAxisColumnNpi: "col2",
      },
      content: undefined,
      children: [],
    };

    it("should preserve chartBlock block type through round-trip", async () => {
      const markdown = await convertBlocksToMarkdown([chartBlock]);
      const blocks = await convertMarkdownToBlocks(markdown);

      const chart = blocks.find((b: any) => b.type === "chartBlock");
      expect(chart).toBeDefined();
    });

    it("should preserve chartBlock props through round-trip", async () => {
      const markdown = await convertBlocksToMarkdown([chartBlock]);
      const blocks = await convertMarkdownToBlocks(markdown);

      const chart = blocks.find((b: any) => b.type === "chartBlock");
      expect(chart.props.tableNpi).toBe("tbl999");
      expect(chart.props.title).toBe("Revenue");
      expect(chart.props.chartType).toBe("bar");
      expect(chart.props.xAxisColumnNpi).toBe("col1");
      expect(chart.props.yAxisColumnNpi).toBe("col2");
    });

    it("should emit raw HTML containing data-content-type in markdown", async () => {
      const markdown = await convertBlocksToMarkdown([chartBlock]);

      expect(markdown).toContain("data-content-type=\"chartBlock\"");
      expect(markdown).toContain("data-table-npi=\"tbl999\"");
      expect(markdown).toContain("data-chart-type=\"bar\"");
    });
  });

  describe("mixed document", () => {
    it("should preserve custom blocks alongside standard blocks", async () => {
      const blocks = [
        {
          id: "h1",
          type: "heading",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left", level: 1},
          content: [{type: "text", text: "Title", styles: {}}],
          children: [],
        },
        {
          id: "table1",
          type: "advancedTable",
          props: {tableId: 7, tableNpi: "npi1", viewProps: JSON.stringify({columns: {}})},
          content: undefined,
          children: [],
        },
        {
          id: "p1",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Some text", styles: {}}],
          children: [],
        },
        {
          id: "chart1",
          type: "chartBlock",
          props: {tableNpi: "npi2", title: "Sales", chartType: "pie", xAxisColumnNpi: "", yAxisColumnNpi: ""},
          content: undefined,
          children: [],
        },
      ];

      const markdown = await convertBlocksToMarkdown(blocks);
      const result = await convertMarkdownToBlocks(markdown);

      // Standard blocks survive
      expect(result.find((b: any) => b.type === "heading")).toBeDefined();
      expect(result.find((b: any) => b.type === "paragraph")).toBeDefined();

      // Custom blocks survive
      const table = result.find((b: any) => b.type === "advancedTable");
      expect(table).toBeDefined();
      expect(table.props.tableNpi).toBe("npi1");

      const chart = result.find((b: any) => b.type === "chartBlock");
      expect(chart).toBeDefined();
      expect(chart.props.title).toBe("Sales");
      expect(chart.props.chartType).toBe("pie");
    });
  });

  describe("standard blocks are unaffected", () => {
    it("should still convert headings correctly", async () => {
      const blocks = [
        {
          id: "h1",
          type: "heading",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left", level: 2},
          content: [{type: "text", text: "Hello", styles: {}}],
          children: [],
        },
      ];

      const markdown = await convertBlocksToMarkdown(blocks);
      expect(markdown.trim()).toBe("## Hello");
    });

    it("should still convert paragraphs with formatting", async () => {
      const blocks = [
        {
          id: "p1",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [
            {type: "text", text: "plain ", styles: {}},
            {type: "text", text: "bold", styles: {bold: true}},
          ],
          children: [],
        },
      ];

      const markdown = await convertBlocksToMarkdown(blocks);
      expect(markdown.trim()).toBe("plain **bold**");
    });

    it("should still convert code blocks with language", async () => {
      const markdown = "```typescript\nconst x = 1;\n```";
      const blocks = await convertMarkdownToBlocks(markdown);

      const codeBlock = blocks.find((b: any) => b.type === "codeBlock");
      expect(codeBlock).toBeDefined();
    });
  });
});

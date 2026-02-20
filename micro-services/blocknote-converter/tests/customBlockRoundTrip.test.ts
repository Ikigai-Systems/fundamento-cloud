import fs from "fs";
import path from "path";
import {convertBlocksToMarkdown, convertMarkdownToBlocks} from "../src/converters";

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf-8");
}

describe("Custom block markdown round-trip", () => {
  describe("advancedTable", () => {
    const fixture = loadFixture("advancedTable.md");

    it("should parse advancedTable block from markdown", async () => {
      const blocks = await convertMarkdownToBlocks(fixture);
      const table = blocks.find((b: any) => b.type === "advancedTable");
      expect(table).toBeDefined();
      expect(table.props.tableId).toBe(42);
      expect(table.props.tableNpi).toBe("abc123");
    });

    it("should round-trip advancedTable back to identical markdown", async () => {
      const blocks = await convertMarkdownToBlocks(fixture);
      const markdown = await convertBlocksToMarkdown(blocks);
      expect(markdown).toBe(fixture);
    });
  });

  describe("chartBlock", () => {
    const fixture = loadFixture("chartBlock.md");

    it("should parse chartBlock from markdown", async () => {
      const blocks = await convertMarkdownToBlocks(fixture);
      const chart = blocks.find((b: any) => b.type === "chartBlock");
      expect(chart).toBeDefined();
      expect(chart.props.tableNpi).toBe("tbl999");
      expect(chart.props.title).toBe("Revenue");
      expect(chart.props.chartType).toBe("bar");
      expect(chart.props.xAxisColumnNpi).toBe("col1");
      expect(chart.props.yAxisColumnNpi).toBe("col2");
    });

    it("should round-trip chartBlock back to identical markdown", async () => {
      const blocks = await convertMarkdownToBlocks(fixture);
      const markdown = await convertBlocksToMarkdown(blocks);
      expect(markdown).toBe(fixture);
    });
  });

  describe("mixed document", () => {
    const fixture = loadFixture("mixed-document.md");

    it("should parse all block types from mixed markdown", async () => {
      const blocks = await convertMarkdownToBlocks(fixture);

      const heading = blocks.find((b: any) => b.type === "heading");
      expect(heading).toBeDefined();
      expect(heading.content[0].text).toBe("Project Overview");

      const paragraphs = blocks.filter((b: any) => b.type === "paragraph");
      expect(paragraphs.some((p: any) => p.content?.[0]?.text === "Here is the data:")).toBe(true);
      expect(paragraphs.some((p: any) => p.content?.[0]?.text === "And the chart:")).toBe(true);

      const table = blocks.find((b: any) => b.type === "advancedTable");
      expect(table).toBeDefined();
      expect(table.props.tableNpi).toBe("abc123");

      const chart = blocks.find((b: any) => b.type === "chartBlock");
      expect(chart).toBeDefined();
      expect(chart.props.title).toBe("Revenue");
      expect(chart.props.chartType).toBe("bar");
    });

    it("should round-trip mixed document back to identical markdown", async () => {
      const blocks = await convertMarkdownToBlocks(fixture);
      const markdown = await convertBlocksToMarkdown(blocks);
      expect(markdown).toBe(fixture);
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

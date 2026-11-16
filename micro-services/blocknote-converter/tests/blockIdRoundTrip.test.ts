import {convertBlocksToMarkdown, convertMarkdownToBlocks, convertMarkdownToBlocksAndYjs} from "../src/converters";

const text = (value: string) => ({type: "text", text: value, styles: {}});

const block = (id: string, type: string, content: unknown, extra: Record<string, unknown> = {}) => ({
  id,
  type,
  props: {},
  content,
  children: [],
  ...extra,
});

// Every block type that has inline content, plus the ones that don't.
const document = () => [
  block("h1-aaaa", "heading", [text("Title")], {props: {level: 1}}),
  block("p1-bbbb", "paragraph", [text("First "), {type: "text", text: "bold", styles: {bold: true}}]),
  block("li-cccc", "bulletListItem", [text("Parent")], {
    children: [block("li-dddd", "bulletListItem", [text("Child")])],
  }),
  block("nl-eeee", "numberedListItem", [text("One")]),
  block("cl-ffff", "checkListItem", [text("Done")], {props: {checked: true}}),
  block("qt-gggg", "quote", [text("Quoted")]),
  block("cd-hhhh", "codeBlock", [text("const a = 1;")], {props: {language: "javascript"}}),
  block("tb-iiii", "table", {
    type: "tableContent",
    columnWidths: [undefined, undefined],
    headerRows: 1,
    rows: [
      {cells: [[text("A")], [text("B")]]},
      {cells: [[text("1")], [text("2")]]},
    ],
  }),
  block("dv-jjjj", "divider", undefined),
  block("p2-kkkk", "paragraph", [text("Last")]),
];

const ids = (blocks: any[]): string[] => blocks.flatMap((b) => [b.id, ...ids(b.children || [])]);
const types = (blocks: any[]): string[] => blocks.flatMap((b) => [b.type, ...types(b.children || [])]);

describe("block ids in markdown", () => {
  describe("export", () => {
    it("writes no markers by default", async () => {
      const markdown = await convertBlocksToMarkdown(document() as any);
      expect(markdown).not.toContain("^");
    });

    it("appends a trailing marker to blocks with inline content", async () => {
      const markdown = await convertBlocksToMarkdown(document() as any, {blockIds: "all"});
      expect(markdown).toContain("# Title ^h1-aaaa");
      expect(markdown).toContain("First **bold** ^p1-bbbb");
      expect(markdown).toContain("Quoted ^qt-gggg");
    });

    it("puts the marker of a block without inline content on its own line after the block", async () => {
      const markdown = await convertBlocksToMarkdown(document() as any, {blockIds: "all"});
      expect(markdown).toMatch(/\n\^tb-iiii\n/);
      expect(markdown).toMatch(/\n\^dv-jjjj\n/);
      expect(markdown).toMatch(/\n\^cd-hhhh\n/);
    });

    it("marks only the requested blocks", async () => {
      const markdown = await convertBlocksToMarkdown(document() as any, {blockIds: ["p1-bbbb", "tb-iiii"]});
      expect(markdown.match(/\^/g)).toHaveLength(2);
      expect(markdown).toContain("^p1-bbbb");
      expect(markdown).toContain("^tb-iiii");
    });

    it("does not write markers into the blocks it is given", async () => {
      const blocks = document();
      await convertBlocksToMarkdown(blocks as any, {blockIds: "all"});
      expect(JSON.stringify(blocks)).not.toContain("^");
      expect(blocks).toHaveLength(document().length);
    });

    it("skips ids the marker syntax cannot carry", async () => {
      const blocks = [block("has space", "paragraph", [text("x")])];
      const markdown = await convertBlocksToMarkdown(blocks as any, {blockIds: "all"});
      expect(markdown).not.toContain("^");
    });
  });

  describe("round trip", () => {
    it("keeps the id of every block", async () => {
      const original = document();
      const markdown = await convertBlocksToMarkdown(original as any, {blockIds: "all"});
      const parsed = await convertMarkdownToBlocks(markdown, {existingIds: "any"});

      expect(types(parsed)).toEqual(types(original));
      expect(ids(parsed)).toEqual(ids(original));
    });

    it("leaves no marker text behind", async () => {
      const markdown = await convertBlocksToMarkdown(document() as any, {blockIds: "all"});
      const parsed = await convertMarkdownToBlocks(markdown, {existingIds: "any"});
      expect(JSON.stringify(parsed)).not.toContain("^");
    });

    it("gives the same markdown back when markers are written again", async () => {
      const first = await convertBlocksToMarkdown(document() as any, {blockIds: "all"});
      const parsed = await convertMarkdownToBlocks(first, {existingIds: "any"});
      const second = await convertBlocksToMarkdown(parsed as any, {blockIds: "all"});
      expect(second).toBe(first);
    });

    it("keeps ids of blocks that end in a link or a mention", async () => {
      const blocks = [
        block("lk-aaaa", "paragraph", [text("See "), {type: "link", href: "https://example.com", content: [text("here")]}]),
        block("mn-bbbb", "paragraph", [
          text("Ask "),
          {type: "mention", props: {entity: "user", entityId: "u1", title: "Ann", id: "m1", fragment: ""}},
        ]),
      ];
      const markdown = await convertBlocksToMarkdown(blocks as any, {blockIds: "all"});
      const parsed = await convertMarkdownToBlocks(markdown, {existingIds: "any"});

      expect(ids(parsed)).toEqual(["lk-aaaa", "mn-bbbb"]);
      expect(JSON.stringify(parsed)).not.toContain("^");
    });

    it("does not let the caption of an image take the image's id", async () => {
      // The caption leaves the HTML as a paragraph of its own, so a marker after the image would
      // land on it. The image goes unmarked; its neighbours keep their ids.
      const blocks = [
        block("im-aaaa", "image", undefined, {props: {url: "https://example.com/a.png", name: "a.png", caption: "A caption"}}),
        block("p1-bbbb", "paragraph", [text("After")]),
      ];
      const markdown = await convertBlocksToMarkdown(blocks as any, {blockIds: "all"});
      const parsed = await convertMarkdownToBlocks(markdown, {existingIds: "any"});

      expect(ids(parsed)).not.toContain("im-aaaa");
      expect(parsed.find((b: any) => b.id === "p1-bbbb")?.type).toBe("paragraph");
      expect(JSON.stringify(parsed)).not.toContain("^");
    });

    it("keeps the id of an image without a caption", async () => {
      const blocks = [
        block("im-aaaa", "image", undefined, {props: {url: "https://example.com/a.png", name: "a.png", caption: ""}}),
        block("p1-bbbb", "paragraph", [text("After")]),
      ];
      const markdown = await convertBlocksToMarkdown(blocks as any, {blockIds: "all"});
      const parsed = await convertMarkdownToBlocks(markdown, {existingIds: "any"});

      expect(ids(parsed)).toEqual(["im-aaaa", "p1-bbbb"]);
    });
  });

  describe("import", () => {
    it("reads Obsidian markers written by hand", async () => {
      const parsed = await convertMarkdownToBlocks("A paragraph ^para-1\n\n> A quote\n\n^quote-1\n", {existingIds: "any"});
      expect(parsed[0].id).toBe("para-1");
      expect(parsed[1].id).toBe("quote-1");
      expect(parsed).toHaveLength(2);
    });

    it("treats markers as ordinary text unless asked to read them", async () => {
      const parsed = await convertMarkdownToBlocks("A paragraph ^para-1\n");
      expect(parsed[0].id).not.toBe("para-1");
      expect(parsed[0].content[0].text).toBe("A paragraph ^para-1");
    });

    it("keeps the first of two blocks claiming the same id", async () => {
      const parsed = await convertMarkdownToBlocks("One ^same\n\nTwo ^same\n", {existingIds: "any"});
      expect(parsed[0].id).toBe("same");
      expect(parsed[1].id).not.toBe("same");
      expect(parsed[1].content[0].text).toBe("Two");
    });

    it("honours only known ids when given the ids that exist", async () => {
      const parsed = await convertMarkdownToBlocks("Known ^abc-1\n\nSee ^note\n", {existingIds: new Set(["abc-1"])});
      expect(parsed[0].id).toBe("abc-1");
      expect(parsed[1].id).not.toBe("note");
      expect(parsed[1].content[0].text).toBe("See ^note");
    });

    it("carries ids through markdownToBlocksAndYjs", async () => {
      const {blocks} = await convertMarkdownToBlocksAndYjs("Hello ^hello-1\n", {existingIds: "any"});
      expect(blocks[0].id).toBe("hello-1");
    });
  });
});

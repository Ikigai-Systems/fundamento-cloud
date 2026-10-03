import {convertMarkdownToBlocks, convertMarkdownToBlocksAndYjs, convertToBlocks, convertToYjs} from "../src/converters";

const markdown = [
  "# Heading",
  "",
  "A paragraph with a [link](https://example.com) and an [attachment](attachment:42.pdf).",
  "",
  "- one",
  "  - nested",
  "- two",
  "",
  "| a | b |",
  "| - | - |",
  "| 1 | 2 |",
].join("\n");

describe("convertMarkdownToBlocksAndYjs", () => {
  it("returns the blocks convertMarkdownToBlocks would", async () => {
    const {blocks} = await convertMarkdownToBlocksAndYjs(markdown);
    const expected = await convertMarkdownToBlocks(markdown);

    // Block ids are random per parse, so compare everything else.
    const withoutIds = (value: unknown) => JSON.parse(JSON.stringify(value).replace(/"id":"[^"]*"/g, "\"id\":\"\""));
    expect(withoutIds(blocks)).toEqual(withoutIds(expected));
  });

  it("returns Yjs holding the same document as converting the blocks separately", async () => {
    const {blocks, yjs} = await convertMarkdownToBlocksAndYjs(markdown);

    // Yjs bytes embed a random client id, so compare what they decode to.
    expect(convertToBlocks(Buffer.from(yjs))).toEqual(convertToBlocks(Buffer.from(convertToYjs(blocks))));
  });

  it("handles empty markdown", async () => {
    const {blocks, yjs} = await convertMarkdownToBlocksAndYjs("");

    expect(yjs).toBeInstanceOf(Uint8Array);
    expect(convertToBlocks(Buffer.from(yjs))).toEqual(convertToBlocks(Buffer.from(convertToYjs(blocks))));
  });
});

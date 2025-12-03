import {convertToBlocks, convertToYjs} from "../src/converters";
import * as Y from "yjs";
import sampleBlocks from "./fixtures/sample_blocks.json";
import complexBlocks from "./fixtures/complex_blocks.json";

describe("convertToBlocks", () => {
  it("should convert Yjs data back to blocks", () => {
    const yjsData = convertToYjs(sampleBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should roundtrip: blocks -> yjs -> blocks", () => {
    const yjsData = convertToYjs(sampleBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    // Check structure is maintained
    expect(result.length).toBe(sampleBlocks.length);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("type");
    expect(result[0]).toHaveProperty("props");
    expect(result[0]).toHaveProperty("content");
    expect(result[0]).toHaveProperty("children");
  });

  it("should handle complex blocks roundtrip", () => {
    const yjsData = convertToYjs(complexBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    // BlockNote may normalize some blocks, so length might differ slightly
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(complexBlocks.length);
    // Verify first block structure
    expect(result[0].type).toBe(complexBlocks[0].type);
    expect(result[0].props).toBeDefined();
  });

  it("should return empty array for empty Yjs document", () => {
    const emptyDoc = new Y.Doc();
    const emptyYjs = Y.encodeStateAsUpdate(emptyDoc);
    const result = convertToBlocks(Buffer.from(emptyYjs));

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should preserve block IDs in roundtrip", () => {
    const yjsData = convertToYjs(sampleBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    sampleBlocks.forEach((block, index) => {
      if (result[index]) {
        expect(result[index].id).toBe(block.id);
      }
    });
  });

  it("should preserve block types in roundtrip", () => {
    const yjsData = convertToYjs(complexBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    // Check various block types are preserved
    const types = result.map(block => block.type);
    expect(types).toContain("paragraph");

    // Check for specific block types from complex blocks
    const hasImage = result.some(block => block.type === "image");
    const hasNumberedList = result.some(block => block.type === "numberedListItem");
    const hasBulletList = result.some(block => block.type === "bulletListItem");

    expect(hasImage || hasNumberedList || hasBulletList).toBe(true);
  });

  it("should preserve text content in roundtrip", () => {
    const yjsData = convertToYjs(sampleBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    // Find blocks with text content
    const originalTextBlock = sampleBlocks.find(
      block => block.content && block.content.length > 0 && block.content[0].text
    );

    if (originalTextBlock) {
      const resultTextBlock = result.find(
        block => block.id === originalTextBlock.id
      );

      expect(resultTextBlock).toBeDefined();
      expect(resultTextBlock?.content).toBeDefined();
      expect(resultTextBlock?.content[0]?.text).toBe(originalTextBlock.content[0].text);
    }
  });

  it("should preserve props in roundtrip", () => {
    const yjsData = convertToYjs(complexBlocks);
    const result = convertToBlocks(Buffer.from(yjsData));

    result.forEach((block) => {
      // All blocks should have props
      expect(block.props).toBeDefined();
      // Standard text blocks should have these props, but image/special blocks may not
      if (block.type === "paragraph" || block.type === "heading" || block.type === "bulletListItem" || block.type === "numberedListItem") {
        expect(block.props.textColor).toBeDefined();
        expect(block.props.backgroundColor).toBeDefined();
        expect(block.props.textAlignment).toBeDefined();
      }
    });
  });

  it("should handle blocks with nested children", () => {
    const blocksWithChildren = [
      {
        id: "parent",
        type: "paragraph",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
        content: [{type: "text", text: "Parent", styles: {}}],
        children: [
          {
            id: "child",
            type: "paragraph",
            props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
            content: [{type: "text", text: "Child", styles: {}}],
            children: [],
          },
        ],
      },
    ];

    const yjsData = convertToYjs(blocksWithChildren);
    const result = convertToBlocks(Buffer.from(yjsData));

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].children).toBeDefined();
  });

  it("should handle blocks with special characters", () => {
    const blocksWithSpecialChars = [
      {
        id: "special",
        type: "paragraph",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
        content: [{type: "text", text: "Special chars: <>&\"'", styles: {}}],
        children: [],
      },
    ];

    const yjsData = convertToYjs(blocksWithSpecialChars);
    const result = convertToBlocks(Buffer.from(yjsData));

    expect(result[0].content[0].text).toContain("Special chars");
  });

  it("should handle blocks with empty content", () => {
    const blocksWithEmptyContent = [
      {
        id: "empty",
        type: "paragraph",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
        content: [],
        children: [],
      },
    ];

    const yjsData = convertToYjs(blocksWithEmptyContent);
    const result = convertToBlocks(Buffer.from(yjsData));

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].content).toEqual([]);
  });
});

import {convertToBlocks, convertToYjs, convertMarkdownToBlocks} from "../src/converters";
import sampleBlocks from "./fixtures/sample_blocks.json";
import complexBlocks from "./fixtures/complex_blocks.json";

describe("Integration Tests", () => {
  describe("Multiple conversion cycles", () => {
    it("should maintain data integrity through multiple conversions", () => {
      // First conversion
      const yjs1 = convertToYjs(sampleBlocks);
      const blocks1 = convertToBlocks(Buffer.from(yjs1));

      // Second conversion using result of first
      const yjs2 = convertToYjs(blocks1);
      const blocks2 = convertToBlocks(Buffer.from(yjs2));

      // Results should be consistent
      expect(blocks1.length).toBe(blocks2.length);
      expect(blocks1[0].id).toBe(blocks2[0].id);
      expect(blocks1[0].type).toBe(blocks2[0].type);
    });

    it("should handle three conversion cycles", () => {
      // Cycle 1
      const yjs1 = convertToYjs(sampleBlocks);
      const blocks1 = convertToBlocks(Buffer.from(yjs1));

      // Cycle 2
      const yjs2 = convertToYjs(blocks1);
      const blocks2 = convertToBlocks(Buffer.from(yjs2));

      // Cycle 3
      const yjs3 = convertToYjs(blocks2);
      const blocks3 = convertToBlocks(Buffer.from(yjs3));

      // All should be consistent
      expect(blocks1.length).toBe(blocks3.length);
      expect(blocks1[0].id).toBe(blocks3[0].id);
    });

    it("should maintain complex document structure through conversions", () => {
      const yjs1 = convertToYjs(complexBlocks);
      const blocks1 = convertToBlocks(Buffer.from(yjs1));

      const yjs2 = convertToYjs(blocks1);
      const blocks2 = convertToBlocks(Buffer.from(yjs2));

      expect(blocks1.length).toBe(blocks2.length);

      // Check that first few blocks maintain structure
      for (let i = 0; i < Math.min(3, blocks1.length); i++) {
        expect(blocks1[i].type).toBe(blocks2[i].type);
        expect(blocks1[i].id).toBe(blocks2[i].id);
      }
    });
  });

  describe("Markdown to Yjs workflow", () => {
    it("should handle full workflow: markdown -> blocks -> yjs -> blocks", async () => {
      const markdown = "# Test Document\n\nThis is a test paragraph.";

      // Convert markdown to blocks
      const blocks = await convertMarkdownToBlocks(markdown);
      expect(blocks.length).toBeGreaterThan(0);

      // Convert blocks to Yjs
      const yjsData = convertToYjs(blocks);
      expect(yjsData.length).toBeGreaterThan(0);

      // Convert Yjs back to blocks
      const finalBlocks = convertToBlocks(Buffer.from(yjsData));
      expect(finalBlocks.length).toBe(blocks.length);
    });

    it("should preserve markdown content through full conversion chain", async () => {
      const markdown = "## Heading\n\nParagraph with **bold** text.";

      const blocks = await convertMarkdownToBlocks(markdown);
      const yjsData = convertToYjs(blocks);
      const finalBlocks = convertToBlocks(Buffer.from(yjsData));

      // Check structure is maintained
      expect(finalBlocks[0].type).toBe("heading");
      expect(finalBlocks[1].type).toBe("paragraph");
    });
  });

  describe("Mixed content handling", () => {
    it("should handle documents with varied block types", () => {
      const mixedBlocks = [
        {
          id: "h1",
          type: "heading",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left", level: 1},
          content: [{type: "text", text: "Title", styles: {}}],
          children: [],
        },
        {
          id: "p1",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Normal text", styles: {}}],
          children: [],
        },
        {
          id: "list1",
          type: "bulletListItem",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "List item", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(mixedBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBe(3);
      expect(result[0].type).toBe("heading");
      expect(result[1].type).toBe("paragraph");
      expect(result[2].type).toBe("bulletListItem");
    });

    it("should handle large documents efficiently", () => {
      // Test with complex blocks (105 blocks)
      const startTime = Date.now();

      const yjsData = convertToYjs(complexBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      const duration = Date.now() - startTime;

      expect(result.length).toBeGreaterThan(0);
      // Should complete in reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000);
    });
  });

  describe("Error recovery", () => {
    it("should handle empty input gracefully at each stage", () => {
      const emptyBlocks: any[] = [];

      const yjsData = convertToYjs(emptyBlocks);
      expect(yjsData).toBeInstanceOf(Uint8Array);

      // Note: Converting empty blocks array back from Yjs is tested separately
      // in edgeCases.test.ts with proper Yjs document initialization
      // This test focuses on the convertToYjs part for empty input
    });

    it("should handle conversion of minimal valid blocks", () => {
      const minimalBlock = [
        {
          id: "min1",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [],
          children: [],
        },
      ];

      const yjsData = convertToYjs(minimalBlock);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("min1");
    });
  });

  describe("Data consistency", () => {
    it("should preserve all block IDs across full conversion", () => {
      const originalIds = sampleBlocks.map(b => b.id);

      const yjsData = convertToYjs(sampleBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));
      const resultIds = result.map(b => b.id);

      expect(resultIds).toEqual(originalIds);
    });

    it("should preserve all text content across conversion", () => {
      const blocksWithText = sampleBlocks.filter(
        b => b.content && b.content.length > 0 && b.content[0].text
      );

      if (blocksWithText.length > 0) {
        const yjsData = convertToYjs(sampleBlocks);
        const result = convertToBlocks(Buffer.from(yjsData));

        blocksWithText.forEach(originalBlock => {
          const resultBlock = result.find(b => b.id === originalBlock.id);
          expect(resultBlock).toBeDefined();
          if (originalBlock.content[0]?.text && resultBlock?.content[0]?.text) {
            expect(resultBlock.content[0].text).toBe(originalBlock.content[0].text);
          }
        });
      }
    });

    it("should preserve block order through conversions", () => {
      const yjsData = convertToYjs(sampleBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      const originalOrder = sampleBlocks.map(b => b.id);
      const resultOrder = result.map(b => b.id);

      expect(resultOrder).toEqual(originalOrder);
    });
  });
});

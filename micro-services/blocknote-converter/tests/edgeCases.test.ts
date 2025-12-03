import {convertToBlocks, convertToYjs} from "../src/converters";
import * as Y from "yjs";

describe("Edge Cases", () => {
  describe("Nested structures", () => {
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

    it("should handle deeply nested children", () => {
      const deeplyNested = [
        {
          id: "level1",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Level 1", styles: {}}],
          children: [
            {
              id: "level2",
              type: "paragraph",
              props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
              content: [{type: "text", text: "Level 2", styles: {}}],
              children: [
                {
                  id: "level3",
                  type: "paragraph",
                  props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
                  content: [{type: "text", text: "Level 3", styles: {}}],
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const yjsData = convertToYjs(deeplyNested);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].children).toBeDefined();
      expect(result[0].children.length).toBeGreaterThan(0);
    });

    it("should handle multiple children at same level", () => {
      const multipleChildren = [
        {
          id: "parent",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Parent", styles: {}}],
          children: [
            {
              id: "child1",
              type: "paragraph",
              props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
              content: [{type: "text", text: "Child 1", styles: {}}],
              children: [],
            },
            {
              id: "child2",
              type: "paragraph",
              props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
              content: [{type: "text", text: "Child 2", styles: {}}],
              children: [],
            },
          ],
        },
      ];

      const yjsData = convertToYjs(multipleChildren);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].children.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Special characters and encoding", () => {
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

    it("should handle unicode characters", () => {
      const unicodeBlocks = [
        {
          id: "unicode",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Unicode: 你好 🎉 émojis", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(unicodeBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].content[0].text).toContain("你好");
      expect(result[0].content[0].text).toContain("🎉");
      expect(result[0].content[0].text).toContain("émojis");
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(10000);
      const longTextBlocks = [
        {
          id: "long",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: longText, styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(longTextBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].content[0].text.length).toBe(10000);
    });

    it("should handle newlines in text", () => {
      const newlineBlocks = [
        {
          id: "newline",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Line 1\nLine 2\nLine 3", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(newlineBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].content[0].text).toContain("\n");
    });
  });

  describe("Empty and minimal content", () => {
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

    it("should handle blocks with empty string content", () => {
      const emptyStringBlocks = [
        {
          id: "emptystr",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(emptyStringBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle blocks with only whitespace", () => {
      const whitespaceBlocks = [
        {
          id: "whitespace",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "   \t\n   ", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(whitespaceBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Unusual props and attributes", () => {
    it("should handle blocks with various text colors", () => {
      const coloredBlocks = [
        {
          id: "red",
          type: "paragraph",
          props: {textColor: "red", backgroundColor: "default", textAlignment: "left"},
          content: [{type: "text", text: "Red text", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(coloredBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].props.textColor).toBe("red");
    });

    it("should handle blocks with different alignments", () => {
      const alignedBlocks = [
        {
          id: "center",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "center"},
          content: [{type: "text", text: "Centered", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(alignedBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].props.textAlignment).toBe("center");
    });

    it("should handle blocks with background colors", () => {
      const bgColorBlocks = [
        {
          id: "yellow",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "yellow", textAlignment: "left"},
          content: [{type: "text", text: "Yellow background", styles: {}}],
          children: [],
        },
      ];

      const yjsData = convertToYjs(bgColorBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].props.backgroundColor).toBe("yellow");
    });
  });

  describe("Complex text styling", () => {
    it("should handle multiple styles on same text", () => {
      const multiStyleBlocks = [
        {
          id: "multi",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [
            {
              type: "text",
              text: "Bold and italic",
              styles: {bold: true, italic: true, underline: true},
            },
          ],
          children: [],
        },
      ];

      const yjsData = convertToYjs(multiStyleBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle mixed styled and unstyled text segments", () => {
      const mixedStyleBlocks = [
        {
          id: "mixed",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: [
            {type: "text", text: "Normal ", styles: {}},
            {type: "text", text: "bold ", styles: {bold: true}},
            {type: "text", text: "italic ", styles: {italic: true}},
            {type: "text", text: "code", styles: {code: true}},
          ],
          children: [],
        },
      ];

      const yjsData = convertToYjs(mixedStyleBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result[0].content.length).toBeGreaterThan(0);
    });
  });

  describe("Invalid or corrupted data handling", () => {
    it("should handle empty Yjs buffer", () => {
      const emptyDoc = new Y.Doc();
      const emptyYjs = Y.encodeStateAsUpdate(emptyDoc);
      const result = convertToBlocks(Buffer.from(emptyYjs));

      expect(result).toEqual([]);
    });

    it("should handle blocks with missing required fields gracefully", () => {
      // This tests the converter's robustness, though it may throw or handle gracefully
      const incompleteBlocks = [
        {
          id: "incomplete",
          type: "paragraph",
          // Missing props
          content: [{type: "text", text: "Text", styles: {}}],
          children: [],
        } as any,
      ];

      // Should either work or throw a descriptive error
      expect(() => {
        convertToYjs(incompleteBlocks);
      }).not.toThrow();
    });
  });

  describe("Performance edge cases", () => {
    it("should handle many small blocks", () => {
      const manyBlocks = Array.from({length: 500}, (_, i) => ({
        id: `block${i}`,
        type: "paragraph",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
        content: [{type: "text", text: `Block ${i}`, styles: {}}],
        children: [],
      }));

      const startTime = Date.now();
      const yjsData = convertToYjs(manyBlocks);
      const result = convertToBlocks(Buffer.from(yjsData));
      const duration = Date.now() - startTime;

      expect(result.length).toBe(500);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("should handle block with many content segments", () => {
      const manySegments = Array.from({length: 100}, (_, i) => ({
        type: "text",
        text: `Segment ${i} `,
        styles: i % 2 === 0 ? {bold: true} : {},
      }));

      const blockWithManySegments = [
        {
          id: "segments",
          type: "paragraph",
          props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
          content: manySegments,
          children: [],
        },
      ];

      const yjsData = convertToYjs(blockWithManySegments);
      const result = convertToBlocks(Buffer.from(yjsData));

      expect(result.length).toBe(1);
      expect(result[0].content.length).toBeGreaterThan(0);
    });
  });
});

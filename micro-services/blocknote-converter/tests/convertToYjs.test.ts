import {convertToYjs} from "../src/converters";
import * as Y from "yjs";
import sampleBlocks from "./fixtures/sample_blocks.json";
import complexBlocks from "./fixtures/complex_blocks.json";

describe("convertToYjs", () => {
  it("should convert sample blocks to Yjs format", () => {
    const result = convertToYjs(sampleBlocks);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should convert complex blocks to Yjs format", () => {
    const result = convertToYjs(complexBlocks);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should convert empty blocks array to Yjs format", () => {
    const emptyBlocks: any[] = [];
    const result = convertToYjs(emptyBlocks);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should produce valid Yjs document that can be loaded", () => {
    const yjsData = convertToYjs(sampleBlocks);
    const doc = new Y.Doc();

    // This should not throw
    expect(() => {
      Y.applyUpdate(doc, new Uint8Array(yjsData));
    }).not.toThrow();

    // Verify the document has content
    const fragment = doc.getXmlFragment("document-store");
    expect(fragment.length).toBeGreaterThan(0);
  });

  it("should produce different outputs for different inputs", () => {
    const result1 = convertToYjs(sampleBlocks);
    const result2 = convertToYjs(complexBlocks);

    // Results should be different
    expect(result1).not.toEqual(result2);
    expect(result1.length).not.toBe(result2.length);
  });

  it("should handle blocks with various types", () => {
    const diverseBlocks = [
      {
        id: "para1",
        type: "paragraph",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
        content: [{type: "text", text: "Paragraph", styles: {}}],
        children: [],
      },
      {
        id: "head1",
        type: "heading",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left", level: 1},
        content: [{type: "text", text: "Heading", styles: {}}],
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

    const result = convertToYjs(diverseBlocks);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);

    // Verify it creates a valid document
    const doc = new Y.Doc();
    expect(() => {
      Y.applyUpdate(doc, new Uint8Array(result));
    }).not.toThrow();
  });

  it("should handle blocks with styled text", () => {
    const styledBlocks = [
      {
        id: "styled1",
        type: "paragraph",
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left"},
        content: [
          {type: "text", text: "Bold", styles: {bold: true}},
          {type: "text", text: " and ", styles: {}},
          {type: "text", text: "italic", styles: {italic: true}},
        ],
        children: [],
      },
    ];

    const result = convertToYjs(styledBlocks);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});

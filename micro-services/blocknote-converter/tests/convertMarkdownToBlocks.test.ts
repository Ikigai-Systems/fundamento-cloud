import {convertMarkdownToBlocks} from "../src/converters";

describe("convertMarkdownToBlocks", () => {
  it("should convert simple markdown to blocks", async () => {
    const markdown = "# Hello World\n\nThis is a paragraph.";
    const result = await convertMarkdownToBlocks(markdown);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should convert heading to heading block", async () => {
    const markdown = "# Main Title";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result[0].type).toBe("heading");
    expect(result[0].content[0].text).toBe("Main Title");
  });

  it("should convert paragraph to paragraph block", async () => {
    const markdown = "This is a simple paragraph.";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result[0].type).toBe("paragraph");
    expect(result[0].content[0].text).toBe("This is a simple paragraph.");
  });

  it("should convert multiple paragraphs", async () => {
    const markdown = "First paragraph.\n\nSecond paragraph.";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].type).toBe("paragraph");
    expect(result[1].type).toBe("paragraph");
  });

  it("should convert bullet list", async () => {
    const markdown = "- Item 1\n- Item 2\n- Item 3";
    const result = await convertMarkdownToBlocks(markdown);

    const listItems = result.filter(block => block.type === "bulletListItem");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("should convert numbered list", async () => {
    const markdown = "1. First\n2. Second\n3. Third";
    const result = await convertMarkdownToBlocks(markdown);

    const listItems = result.filter(block => block.type === "numberedListItem");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("should handle empty markdown", async () => {
    const markdown = "";
    const result = await convertMarkdownToBlocks(markdown);

    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle markdown with code blocks", async () => {
    const markdown = "```javascript\nconst x = 1;\n```";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result.length).toBeGreaterThan(0);
    const codeBlock = result.find(block => block.type === "codeBlock");
    expect(codeBlock).toBeDefined();
  });

  it("should handle markdown with bold and italic text", async () => {
    const markdown = "This is **bold** and *italic* text.";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result[0].content).toBeDefined();
    const hasStyledText = result[0].content.some(
      (item: any) => item.styles && (item.styles.bold || item.styles.italic)
    );
    expect(hasStyledText).toBe(true);
  });

  it("should handle complex markdown document", async () => {
    const markdown = `# Title

This is a paragraph with **bold** text.

## Subtitle

- List item 1
- List item 2

1. Numbered item 1
2. Numbered item 2`;

    const result = await convertMarkdownToBlocks(markdown);

    expect(result.length).toBeGreaterThan(5);

    const types = result.map(block => block.type);
    expect(types).toContain("heading");
    expect(types).toContain("paragraph");
  });

  it("should handle markdown with links", async () => {
    const markdown = "Check out [this link](https://example.com).";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe("paragraph");
  });

  it("should handle markdown with inline code", async () => {
    const markdown = "Use `console.log()` to debug.";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result[0].content).toBeDefined();
    const hasCode = result[0].content.some(
      (item: any) => item.styles && item.styles.code
    );
    expect(hasCode).toBe(true);
  });

  it("should handle markdown with blockquotes", async () => {
    const markdown = "> This is a quote";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle markdown with horizontal rules", async () => {
    const markdown = "Text above\n\n---\n\nText below";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result.length).toBeGreaterThan(0);
  });

  it("should preserve text formatting across conversions", async () => {
    const markdown = "**Bold** and *italic* and ***both***";
    const result = await convertMarkdownToBlocks(markdown);

    expect(result[0].content.length).toBeGreaterThan(1);
  });

  it("should convert relative-path video to video block", async () => {
    const result = await convertMarkdownToBlocks("![clip](Pliki/video.mp4)");
    expect(result[0].type).toBe("video");
    expect(result[0].props.url).toBe("Pliki/video.mp4");
  });

  it("should convert relative-path audio to audio block", async () => {
    const result = await convertMarkdownToBlocks("![clip](Pliki/audio.mp3)");
    expect(result[0].type).toBe("audio");
    expect(result[0].props.url).toBe("Pliki/audio.mp3");
  });

  it("should convert relative-path PDF to file block", async () => {
    const result = await convertMarkdownToBlocks("![doc](Pliki/report.pdf)");
    expect(result[0].type).toBe("file");
    expect(result[0].props.url).toBe("Pliki/report.pdf");
  });

  it("should keep relative-path image as image block", async () => {
    const result = await convertMarkdownToBlocks("![pic](Pliki/photo.jpg)");
    expect(result[0].type).toBe("image");
    expect(result[0].props.url).toBe("Pliki/photo.jpg");
  });
});

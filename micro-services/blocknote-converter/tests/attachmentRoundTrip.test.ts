import {convertBlocksToMarkdown, convertMarkdownToBlocks} from "../src/converters";

const fileBlock = {
  id: "b1",
  type: "file",
  props: {name: "report.csv", url: "attachment:4209", caption: ""},
  children: [],
};

describe("attachment round-trip", () => {
  it("emits the embed form for a file block", async () => {
    // The link form `[name](url)` cannot be parsed back into a file block: BlockNote drops
    // custom URL schemes when parsing an anchor, so it would silently lose the attachment.
    const markdown = await convertBlocksToMarkdown([fileBlock] as any);

    expect(markdown).toContain("![report.csv](attachment:4209)");
    // and never the bare link form, which is the one that cannot be parsed back
    expect(markdown).not.toMatch(/(?<!!)\[report\.csv\]\(attachment:4209\)/);
  });

  it("survives blocks → markdown → blocks without losing the url", async () => {
    const markdown = await convertBlocksToMarkdown([fileBlock] as any);
    const blocks = await convertMarkdownToBlocks(markdown);

    const file = blocks.find((b: any) => b.type === "file");
    expect(file).toBeDefined();
    expect(file.props.url).toBe("attachment:4209");
    expect(file.props.name).toBe("report.csv");
  });

  it("leaves ordinary inline links alone", async () => {
    const paragraph = {
      id: "b2",
      type: "paragraph",
      props: {},
      content: [
        {
          type: "link",
          href: "https://example.com",
          content: [{type: "text", text: "a real link", styles: {}}],
        },
      ],
      children: [],
    };

    const markdown = await convertBlocksToMarkdown([paragraph] as any);
    expect(markdown).toContain("[a real link](https://example.com)");
    expect(markdown).not.toContain("![a real link]");

    const blocks = await convertMarkdownToBlocks(markdown);
    const link = blocks[0].content.find((c: any) => c.type === "link");
    expect(link.href).toBe("https://example.com");
  });

  it("survives a video block round-trip", async () => {
    const video = {
      id: "b4",
      type: "video",
      props: {name: "clip.mp4", url: "attachment:777.mp4", caption: ""},
      children: [],
    };

    const blocks = await convertMarkdownToBlocks(await convertBlocksToMarkdown([video] as any));

    expect(blocks[0].type).toBe("video");
    expect(blocks[0].props.url).toBe("attachment:777.mp4");
  });

  it("survives an inline link using the internal attachment: scheme", async () => {
    // Blocks address attachments as attachment:<id> so a document can be served through
    // the authenticated or the public route without naming either. BlockNote drops hrefs
    // outside its scheme allowlist, so the editor is configured to permit this one.
    const paragraph = {
      id: "b5",
      type: "paragraph",
      props: {},
      content: [
        {type: "text", text: "see ", styles: {}},
        {
          type: "link",
          href: "attachment:1234",
          content: [{type: "text", text: "Pierwsza wersja", styles: {}}],
        },
        {type: "text", text: " here", styles: {}},
      ],
      children: [],
    };

    const markdown = await convertBlocksToMarkdown([paragraph] as any);
    expect(markdown).toContain("[Pierwsza wersja](attachment:1234)");
    // and never the embed form, which would render a second copy of the file
    expect(markdown).not.toContain("![Pierwsza wersja]");

    const blocks = await convertMarkdownToBlocks(markdown);
    const link = blocks[0].content.find((c: any) => c.type === "link");
    expect(link.href).toBe("attachment:1234");
    expect(link.content[0].text).toBe("Pierwsza wersja");
  });

  it("still drops a javascript: href", async () => {
    // Widening the allowlist must not widen it to anything dangerous.
    const blocks = await convertMarkdownToBlocks("[click](javascript:alert(1))");

    expect(blocks[0].content.find((c: any) => c.type === "link")).toBeUndefined();
  });

  it("keeps image blocks on the embed form they already used", async () => {
    const image = {
      id: "b3",
      type: "image",
      props: {name: "pic.png", url: "attachment:4045.png", caption: ""},
      children: [],
    };

    const markdown = await convertBlocksToMarkdown([image] as any);
    const blocks = await convertMarkdownToBlocks(markdown);

    expect(blocks[0].type).toBe("image");
    expect(blocks[0].props.url).toBe("attachment:4045.png");
  });
});

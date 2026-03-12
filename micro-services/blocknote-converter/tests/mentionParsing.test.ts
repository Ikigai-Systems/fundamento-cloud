import {convertMarkdownToBlocks, convertBlocksToMarkdown} from "../src/converters";

describe("mention HTML parsing", () => {
  it("converts <span data-mention='document'> to mention node with correct props", async () => {
    const markdown = 'See <span data-mention="document" data-entity-id="doc_abc">Project Plan</span> for details.';
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    expect(paragraph.type).toBe("paragraph");

    const mentionNode = paragraph.content.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeDefined();
    expect(mentionNode.props.entity).toBe("document");
    expect(mentionNode.props.entityId).toBe("doc_abc");
    expect(mentionNode.props.title).toBe("Project Plan");
    expect(mentionNode.props.id).toBeTruthy(); // Should have a generated UUID
  });

  it("converts <span data-mention='document'> with empty entity-id to broken mention", async () => {
    const markdown = 'See <span data-mention="document" data-entity-id="">Missing Doc</span> here.';
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    const mentionNode = paragraph.content.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeDefined();
    expect(mentionNode.props.entity).toBe("document");
    expect(mentionNode.props.entityId).toBe("");
    expect(mentionNode.props.title).toBe("Missing Doc");
  });

  it("converts <span data-mention='table'> to table mention", async () => {
    const markdown = 'Check <span data-mention="table" data-entity-id="tbl_xyz">Budget</span> table.';
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    const mentionNode = paragraph.content.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeDefined();
    expect(mentionNode.props.entity).toBe("table");
    expect(mentionNode.props.entityId).toBe("tbl_xyz");
  });

  it("does NOT convert regular <a href='/d/npi'> links to mentions", async () => {
    const markdown = "Check [this doc](/d/doc_abc) for details.";
    const result = await convertMarkdownToBlocks(markdown);

    const paragraph = result[0];
    const mentionNode = paragraph.content?.find((c: any) => c.type === "mention");
    expect(mentionNode).toBeUndefined();
  });
});

describe("mention HTML serialization", () => {
  it("serializes mention nodes to <span data-mention> HTML", async () => {
    const blocks = [
      {
        id: "block-1",
        type: "paragraph" as const,
        props: {textColor: "default", backgroundColor: "default", textAlignment: "left" as const},
        content: [
          {type: "text" as const, text: "See ", styles: {}},
          {
            type: "mention" as const,
            props: {
              id: "uuid-123",
              entity: "document",
              entityId: "doc_abc",
              title: "Project Plan"
            }
          },
          {type: "text" as const, text: " for details.", styles: {}}
        ],
        children: []
      }
    ];

    const markdown = await convertBlocksToMarkdown(blocks);
    expect(markdown).toContain("data-mention");
    expect(markdown).toContain("document");
    expect(markdown).toContain("doc_abc");
    expect(markdown).toContain("Project Plan");
  });
});

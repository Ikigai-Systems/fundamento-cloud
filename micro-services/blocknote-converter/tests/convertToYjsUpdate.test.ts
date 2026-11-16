import * as Y from "yjs";
import {updateYFragment} from "y-prosemirror";
import {convertToBlocks, convertToYjs, convertToYjsUpdate} from "../src/converters";
import {ServerBlockNoteEditor} from "@blocknote/server-util";
import strippedSchema from "../src/strippedSchema";

const paragraph = (id: string, text: string) => ({
  id,
  type: "paragraph",
  props: {},
  content: [{type: "text", text, styles: {}}],
  children: [],
});

const original = () => [paragraph("a-1", "First"), paragraph("b-2", "Second"), paragraph("c-3", "Third")];

const texts = (blocks: any[]) => blocks.map((b) => `${b.id}:${b.content?.[0]?.text ?? ""}`);

const docFrom = (state: Uint8Array) => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return doc;
};

const blocksOf = (doc: Y.Doc) => convertToBlocks(Buffer.from(Y.encodeStateAsUpdate(doc)));

// What a client does when its user edits: the same diff, made on the client's copy of the doc.
const editLikeAClient = (doc: Y.Doc, blocks: any[]) => {
  const editor = ServerBlockNoteEditor.create({schema: strippedSchema});
  updateYFragment(doc, doc.getXmlFragment("document-store"), editor._blocksToProsemirrorNode(blocks), {
    mapping: new Map(),
    isOMark: new Map(),
  } as any);
};

describe("convertToYjsUpdate", () => {
  // One stored state, as in life: every copy of it comes from the same document.
  const stored = Buffer.from(convertToYjs(original() as any));
  const base = () => stored;

  it("gives an update that turns the current state into the new blocks", () => {
    const edited = [paragraph("a-1", "First"), paragraph("b-2", "Second, edited"), paragraph("c-3", "Third"), paragraph("d-4", "Fourth")];

    const {update} = convertToYjsUpdate(base(), edited as any);
    const doc = docFrom(base());
    Y.applyUpdate(doc, update);

    expect(texts(blocksOf(doc))).toEqual(texts(edited));
  });

  it("returns the whole new state as well, ready to store", () => {
    const edited = [paragraph("a-1", "First"), paragraph("b-2", "Second, edited"), paragraph("c-3", "Third")];

    const {state} = convertToYjsUpdate(base(), edited as any);

    expect(texts(convertToBlocks(Buffer.from(state)))).toEqual(texts(edited));
  });

  it("touches only what changed", () => {
    const edited = [paragraph("a-1", "First"), paragraph("b-2", "Second, edited"), paragraph("c-3", "Third")];

    const {update, state} = convertToYjsUpdate(base(), edited as any);

    expect(update.length).toBeLessThan(state.length / 2);
  });

  it("changes nothing when the blocks are the same", () => {
    const {state} = convertToYjsUpdate(base(), original() as any);

    expect(texts(convertToBlocks(Buffer.from(state)))).toEqual(texts(original()));
    expect(Y.encodeStateVector(docFrom(state))).toEqual(Y.encodeStateVector(docFrom(base())));
  });

  it("merges with an edit a client made to another block in the meantime", () => {
    const client = docFrom(base());
    editLikeAClient(client, [paragraph("a-1", "First, by the user"), paragraph("b-2", "Second"), paragraph("c-3", "Third")]);

    const server = convertToYjsUpdate(base(), [
      paragraph("a-1", "First"),
      paragraph("b-2", "Second"),
      paragraph("c-3", "Third, by the API"),
    ] as any);

    // Each side receives the other's update, in either order.
    const serverDoc = docFrom(server.state);
    Y.applyUpdate(serverDoc, Y.encodeStateAsUpdate(client, Y.encodeStateVector(docFrom(base()))));
    Y.applyUpdate(client, server.update);

    const expected = ["a-1:First, by the user", "b-2:Second", "c-3:Third, by the API"];
    expect(texts(blocksOf(client))).toEqual(expected);
    expect(texts(blocksOf(serverDoc))).toEqual(expected);
  });

  it("leaves a block the new markdown dropped out, and keeps one a client added", () => {
    const client = docFrom(base());
    editLikeAClient(client, [...original(), paragraph("z-9", "Added by the user")] as any);

    const server = convertToYjsUpdate(base(), [paragraph("a-1", "First"), paragraph("c-3", "Third")] as any);
    Y.applyUpdate(client, server.update);

    const ids = blocksOf(client).map((b: any) => b.id);
    expect(ids).not.toContain("b-2");
    expect(ids).toContain("z-9");
  });

  it("starts from nothing when the document has no content yet", () => {
    const {update} = convertToYjsUpdate(Buffer.from(Y.encodeStateAsUpdate(new Y.Doc())), original() as any);
    const doc = new Y.Doc();
    Y.applyUpdate(doc, update);

    expect(texts(blocksOf(doc))).toEqual(texts(original()));
  });
});

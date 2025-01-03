import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";

export function convertToBlocks(yjs : Buffer) {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(yjs));

  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  if (doc.getXmlFragment("document-store").length !== 0) {
    return serverBlockNoteEditor.yDocToBlocks(doc, "document-store");
  } else {
    return [];
  }
}

export function convertToYjs(blocks: any) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  return Y.encodeStateAsUpdate(serverBlockNoteEditor.blocksToYDoc(blocks, "document-store"));
}

export async function convertMarkdownToBlocks(markdown: string) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  return await serverBlockNoteEditor.tryParseMarkdownToBlocks(markdown);
}
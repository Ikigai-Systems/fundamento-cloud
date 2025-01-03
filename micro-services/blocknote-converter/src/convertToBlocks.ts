import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";

export function convertToBlocks(base64: string) {
  const update = Uint8Array.from(Buffer.from(base64, 'base64'));
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);

  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  if (doc.getXmlFragment("document-store").length !== 0) {
    return serverBlockNoteEditor.yDocToBlocks(doc, "document-store");
  } else {
    return [];
  }
}
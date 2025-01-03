import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";

export function convertToYjs(blocks: any) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  return Y.encodeStateAsUpdate(serverBlockNoteEditor.blocksToYDoc(blocks, "document-store"));
}
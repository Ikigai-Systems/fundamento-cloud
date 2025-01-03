import {ServerBlockNoteEditor} from "@blocknote/server-util";

export function convertToYjs(blocks: any) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  return serverBlockNoteEditor.blocksToYDoc(blocks);
}
import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";
import strippedSchema from "./strippedSchema";
import {setupDOM} from "./setupDOM";

// Initialize DOM environment for React server-side rendering
setupDOM();

export function convertToBlocks(yjs : Buffer) {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(yjs));

  const serverBlockNoteEditor = createServerBlockNoteEditor();

  if (doc.getXmlFragment("document-store").length !== 0) {
    return serverBlockNoteEditor.yDocToBlocks(doc, "document-store");
  } else {
    return [];
  }
}

function createServerBlockNoteEditor() {
  return ServerBlockNoteEditor.create({
    schema: strippedSchema,
  });
}

export function convertToYjs(blocks: any) {
  const serverBlockNoteEditor = createServerBlockNoteEditor();

  return Y.encodeStateAsUpdate(serverBlockNoteEditor.blocksToYDoc(blocks, "document-store"));
}

export async function convertMarkdownToBlocks(markdown: string) {
  const serverBlockNoteEditor = createServerBlockNoteEditor();

  return await serverBlockNoteEditor.tryParseMarkdownToBlocks(markdown);
}

export async function convertBlocksToMarkdown(blocks: any) {
  const serverBlockNoteEditor = createServerBlockNoteEditor();

  return await serverBlockNoteEditor.blocksToMarkdownLossy(blocks);
}
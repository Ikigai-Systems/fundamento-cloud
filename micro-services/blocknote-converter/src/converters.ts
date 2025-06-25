import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";
import strippedSchema from "./strippedSchema";
import {
  DOCXExporter,
  docxDefaultSchemaMappings,
} from "@blocknote/xl-docx-exporter";
import { Packer } from "docx";

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
  const serverBlockNoteEditor = ServerBlockNoteEditor.create({
    schema: strippedSchema,
  });

  return Y.encodeStateAsUpdate(serverBlockNoteEditor.blocksToYDoc(blocks, "document-store"));
}

export async function convertMarkdownToBlocks(markdown: string) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  return await serverBlockNoteEditor.tryParseMarkdownToBlocks(markdown);
}

export async function convertBlocksToMarkdown(blocks: any) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  return await serverBlockNoteEditor.blocksToMarkdownLossy(blocks);
}

export async function convertBlocksToDocx(blocks: any) {
  const serverBlockNoteEditor = ServerBlockNoteEditor.create();

  const exporter = new DOCXExporter(serverBlockNoteEditor.editor.schema, docxDefaultSchemaMappings);

  const docxDocument = await exporter.toDocxJsDocument(serverBlockNoteEditor.editor.document);

  return await Packer.toBuffer(docxDocument);
}
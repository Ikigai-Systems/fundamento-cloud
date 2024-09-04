import { ServerBlockNoteEditor } from "@blocknote/server-util";
import * as Y from 'yjs';
import fs from "fs";

import schema from "./schema/index.mjs"

async function convertToHtml(doc) {
  let serverBlockNoteEditor = ServerBlockNoteEditor.create({
    // schema,
  });
  const blocks = serverBlockNoteEditor.yDocToBlocks(doc, "document-store");
  return serverBlockNoteEditor.blocksToHTMLLossy(blocks);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const base64EncodedDiff = await readStdin()
const update = Uint8Array.from(Buffer.from(base64EncodedDiff, 'base64'));
// const update = Uint8Array.from(JSON.parse(fs.readFileSync("62.diff", "utf-8")));

const doc = new Y.Doc();
Y.applyUpdate(doc, update);

console.log(await convertToHtml(doc));
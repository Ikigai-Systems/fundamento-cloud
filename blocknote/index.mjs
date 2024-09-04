import { ServerBlockNoteEditor } from "@blocknote/server-util";
import * as Y from 'yjs';
import fs from "fs";

import schema from "./schema/index.mjs"

async function convertToHtml(base64) {
  const update = Uint8Array.from(Buffer.from(base64, 'base64'));
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);

  let serverBlockNoteEditor = ServerBlockNoteEditor.create({
    schema,
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

if (process.argv.length > 2) {
  let params = process.argv.slice(2);
  for(let param of params) {
    const base64EncodedDiff = fs.readFileSync(param, "utf-8");
    console.log(await convertToHtml(base64EncodedDiff));
  }
} else {
  const base64EncodedDiff = await readStdin();
  console.log(await convertToHtml(base64EncodedDiff));
}


import { ServerBlockNoteEditor } from "@blocknote/server-util";
import * as Y from 'yjs';
import fs from "fs";
import schema from "../../../app/javascript/components/editor/schema";

function convertToBlocks(base64: string) {
  const update = Uint8Array.from(Buffer.from(base64, 'base64'));
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);

  const serverBlockNoteEditor = ServerBlockNoteEditor.create({
    schema,
  });

  if (doc.getXmlFragment("document-store").length !== 0) {
    return serverBlockNoteEditor.yDocToBlocks(doc, "document-store");
  } else {
    return [];
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const execute = async (process) => {
  if (process.argv.length > 2) {
    const params = process.argv.slice(2);
    for (const param of params) {
      const base64EncodedDiff = await fs.readFileSync(param, "utf-8");
      console.log(JSON.stringify(convertToBlocks(base64EncodedDiff), null, 2));
    }
  } else {
    const base64EncodedDiff = await readStdin();
    console.log(JSON.stringify(convertToBlocks(base64EncodedDiff), null, 2));
  }
}

execute(process);
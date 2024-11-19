import fs from "fs";
import {convertToBlocks} from "./convertToBlocks";

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
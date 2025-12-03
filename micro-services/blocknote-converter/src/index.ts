import fs from "fs";
import path from "path";
import {convertBlocksToMarkdown, convertMarkdownToBlocks, convertToBlocks, convertToYjs} from "./converters";
import {Command} from "commander";

const program = new Command();

program
  .name("blocknote-converter")
  .description("CLI tool for converting YJS to blocknote and reverse");

function createInputStream(input) {
  const inputStream = input
    ? fs.createReadStream(path.resolve(input))
    : process.stdin;

  inputStream.on('error', (err) => {
    console.error(`Error reading input: ${err.message}`);
    process.exit(1);
  });

  return inputStream;
}

function createOutputStream(output) {
  const outputStream = output
    ? fs.createWriteStream(path.resolve(output))
    : process.stdout;

  outputStream.on('error', (err) => {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  });
  
  return outputStream;
}

program
  .command("convert-yjs-to-blocks")
  .description("Convert YJS to blocknote")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    const inputStream = createInputStream(options.input);

    const outputStream = createOutputStream(options.output);

    const chunks = [];

    inputStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    inputStream.on('end', () => {
      const convertedData = convertToBlocks(Buffer.concat(chunks));

      outputStream.write(JSON.stringify(convertedData));

      if (!options.output) {
        outputStream.end();
      }
    });
  });

program
  .command("convert-blocks-to-yjs")
  .description("Convert Blocknote to YJS")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    const inputStream = createInputStream(options.input);

    const chunks = [];

    inputStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    inputStream.on('end', () => {
      const convertedData = convertToYjs(JSON.parse(Buffer.concat(chunks).toString("utf8")));

      const outputStream = createOutputStream(options.output);
      outputStream.write(convertedData);

      if (!options.output) {
        outputStream.end();
      }
    });
  });

program
  .command("convert-markdown-to-blocks")
  .description("Convert Markdown to Blocknote")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    const inputStream = createInputStream(options.input);

    const outputStream = createOutputStream(options.output);

    const chunks = [];

    inputStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    inputStream.on('end', async () => {
      const convertedData = await convertMarkdownToBlocks(Buffer.concat(chunks).toString("utf8"));

      outputStream.write(JSON.stringify(convertedData));

      if (!options.output) {
        outputStream.end();
      }
    });
  });

program
  .command("convert-blocks-to-markdown")
  .description("Convert Blocknote to Markdown")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    const inputStream = createInputStream(options.input);

    const outputStream = createOutputStream(options.output);

    const chunks = [];

    inputStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    inputStream.on('end', async () => {
      const convertedData = await convertBlocksToMarkdown(JSON.parse(Buffer.concat(chunks).toString("utf8")));

      outputStream.write(convertedData);

      if (!options.output) {
        outputStream.end();
      }
    });
  });

program.parse(process.argv);
import fs from "fs";
import path from "path";
import {convertBlocksToMarkdown, convertMarkdownToBlocks, convertMarkdownToBlocksAndYjs, convertToBlocks, convertToYjs, convertToYjsUpdate} from "./converters";
import type {Block} from "@blocknote/core";
import {Command} from "commander";
import {startServer, toExistingIds} from "./server";
import * as Sentry from "@sentry/node";

// Initialize Sentry if DSN is provided
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
    // Set profileSessionSampleRate to profile 100% of sessions, and run the
    // profiler for the lifetime of each sampled trace -- together these are the
    // v11 equivalent of the old profilesSampleRate.
    // We recommend adjusting this value in production.
    profileSessionSampleRate: 1.0,
    profileLifecycle: "trace",
  });
}

// Global error handlers for uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  Sentry.captureException(error);
  Sentry.close(2000).then(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  Sentry.captureException(reason);
});

const program = new Command();

program
  .name("blocknote-converter")
  .description("CLI tool for converting YJS to blocknote and reverse");

function createInputStream(input?: string) {
  const inputStream = input
    ? fs.createReadStream(path.resolve(input))
    : process.stdin;

  inputStream.on('error', (err) => {
    console.error(`Error reading input: ${err.message}`);
    Sentry.captureException(err);
    Sentry.close(2000).then(() => {
      process.exit(1);
    });
  });

  return inputStream;
}

function createOutputStream(output?: string) {
  const outputStream = output
    ? fs.createWriteStream(path.resolve(output))
    : process.stdout;

  outputStream.on('error', (err) => {
    console.error(`Error writing output: ${err.message}`);
    Sentry.captureException(err);
    Sentry.close(2000).then(() => {
      process.exit(1);
    });
  });

  return outputStream;
}

interface ConversionOptions {
  input?: string;
  output?: string;
}

// Generic handler for processing stream data with error handling
function handleStreamConversion(options: ConversionOptions, converterFn: (data: Buffer) => unknown | Promise<unknown>, outputIsJson: boolean = true) {
  const inputStream = createInputStream(options.input);
  const outputStream = createOutputStream(options.output);
  const chunks: Buffer[] = [];

  inputStream.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  inputStream.on('end', async () => {
    try {
      const inputData = Buffer.concat(chunks);
      const convertedData = await converterFn(inputData);

      if (outputIsJson) {
        outputStream.write(JSON.stringify(convertedData));
      } else {
        outputStream.write(convertedData as string | Buffer);
      }

      if (!options.output) {
        outputStream.end();
      }
    } catch (error) {
      console.error(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
      Sentry.captureException(error);
      Sentry.close(2000).then(() => {
        process.exit(1);
      });
    }
  });
}

// With --json the markdown arrives in an envelope that can carry options; without it, as it always
// did, the bare markdown.
function markdownInput(data: Buffer, json: boolean | undefined) {
  if (!json) {
    return {markdown: data.toString("utf8"), existingIds: undefined};
  }

  const {markdown, existingIds} = JSON.parse(data.toString("utf8")) as {markdown: string; existingIds?: string[] | "any"};
  return {markdown, existingIds: toExistingIds(existingIds)};
}

program
  .command("convert-yjs-to-blocks")
  .description("Convert YJS to blocknote")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    handleStreamConversion(options, convertToBlocks, true);
  });

program
  .command("convert-blocks-to-yjs")
  .description("Convert Blocknote to YJS")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    handleStreamConversion(
      options,
      (data) => convertToYjs(JSON.parse(data.toString("utf8"))),
      false
    );
  });

program
  .command("convert-blocks-to-yjs-update")
  .description("Bring a YJS state to the given blocks; JSON in {sync, blocks}, JSON out {update, state}, both base64")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    handleStreamConversion(
      options,
      (data) => {
        const {sync, blocks} = JSON.parse(data.toString("utf8")) as {sync: string; blocks: Block[]};
        const {update, state} = convertToYjsUpdate(Buffer.from(sync, "base64"), blocks);
        return {update: Buffer.from(update).toString("base64"), state: Buffer.from(state).toString("base64")};
      },
      true
    );
  });

program
  .command("convert-markdown-to-blocks")
  .description("Convert Markdown to Blocknote")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("--json", "Read a JSON envelope on stdin instead of the bare payload, to pass options")
  .action((options) => {
    handleStreamConversion(
      options,
      (data) => {
        const {markdown, existingIds} = markdownInput(data, options.json);
        return convertMarkdownToBlocks(markdown, {existingIds});
      },
      true
    );
  });

program
  .command("convert-markdown-to-blocks-and-yjs")
  .description("Convert Markdown to Blocknote and YJS in one pass; YJS is base64 in the JSON output")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("--json", "Read a JSON envelope on stdin instead of the bare payload, to pass options")
  .action((options) => {
    handleStreamConversion(
      options,
      async (data) => {
        const {markdown, existingIds} = markdownInput(data, options.json);
        const {blocks, yjs} = await convertMarkdownToBlocksAndYjs(markdown, {existingIds});
        return {blocks, yjs: Buffer.from(yjs).toString("base64")};
      },
      true
    );
  });

program
  .command("convert-blocks-to-markdown")
  .description("Convert Blocknote to Markdown")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("--json", "Read a JSON envelope on stdin instead of the bare payload, to pass options")
  .action((options) => {
    handleStreamConversion(
      options,
      (data) => {
        const input = JSON.parse(data.toString("utf8"));
        return options.json
          ? convertBlocksToMarkdown(input.blocks, {blockIds: input.blockIds})
          : convertBlocksToMarkdown(input);
      },
      false
    );
  });

program
  .command("server")
  .description("Start HTTP server for conversions")
  .option("-p, --port <number>", "Port number")
  .option("-h, --host <address>", "Host address")
  .action((options) => {
    const port = options.port
      ? parseInt(options.port)
      : (process.env.PORT ? parseInt(process.env.PORT) : 3002);
    const host = options.host || process.env.HTTP_HOST || "127.0.0.1";
    startServer(port, host);
  });

program.parse(process.argv);
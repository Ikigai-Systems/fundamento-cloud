import fs from "fs";
import path from "path";
import {convertBlocksToMarkdown, convertMarkdownToBlocks, convertToBlocks, convertToYjs} from "./converters";
import {Command} from "commander";
import {startServer} from "./server";
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
    // Set profilesSampleRate to profile 100%
    // of sampled transactions.
    // We recommend adjusting this value in production.
    profilesSampleRate: 1.0,
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

function createInputStream(input) {
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

function createOutputStream(output) {
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

// Generic handler for processing stream data with error handling
function handleStreamConversion(options, converterFn: (data: Buffer) => any | Promise<any>, outputIsJson: boolean = true) {
  const inputStream = createInputStream(options.input);
  const outputStream = createOutputStream(options.output);
  const chunks = [];

  inputStream.on('data', (chunk) => {
    chunks.push(chunk);
  });

  inputStream.on('end', async () => {
    try {
      const inputData = Buffer.concat(chunks);
      const convertedData = await converterFn(inputData);

      if (outputIsJson) {
        outputStream.write(JSON.stringify(convertedData));
      } else {
        outputStream.write(convertedData);
      }

      if (!options.output) {
        outputStream.end();
      }
    } catch (error) {
      console.error(`Conversion error: ${error.message}`);
      Sentry.captureException(error);
      Sentry.close(2000).then(() => {
        process.exit(1);
      });
    }
  });
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
  .command("convert-markdown-to-blocks")
  .description("Convert Markdown to Blocknote")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    handleStreamConversion(
      options,
      (data) => convertMarkdownToBlocks(data.toString("utf8")),
      true
    );
  });

program
  .command("convert-blocks-to-markdown")
  .description("Convert Blocknote to Markdown")
  .option("-i, --input <file>", "Input file (default: stdin)")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .action((options) => {
    handleStreamConversion(
      options,
      (data) => convertBlocksToMarkdown(JSON.parse(data.toString("utf8"))),
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
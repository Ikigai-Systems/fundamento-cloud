import Fastify from "fastify";
import FormBodyPlugin from "@fastify/formbody";
import {convertToBlocks, convertToYjs, convertMarkdownToBlocks, convertBlocksToMarkdown} from "./converters";
import {Buffer} from "buffer";

type RouteHandler = (request: any, reply: any) => Promise<any>;

function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, reply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Conversion failed"
      });
    }
  };
}

export async function startServer(port: number, host: string) {
  const fastify = Fastify({
    logger: true,
  });

  fastify.register(FormBodyPlugin);

  // Convert YJS to Blocks
  fastify.post("/convert/yjs/blocks", withErrorHandling(async (request, reply) => {
    const body = request.body as {yjs?: string};

    if (!body.yjs) {
      return reply.status(400).send({
        error: "Missing required field: yjs"
      });
    }

    const blocks = convertToBlocks(Buffer.from(body.yjs, "base64"));

    return {blocks};
  }));

  // Convert Blocks to YJS
  fastify.post("/convert/blocks/yjs", withErrorHandling(async (request, reply) => {
    const body = request.body as {blocks?: any};

    if (!body.blocks) {
      return reply.status(400).send({
        error: "Missing required field: blocks"
      });
    }

    const yjsData = convertToYjs(body.blocks);
    const yjs = Buffer.from(yjsData).toString("base64");

    return {yjs};
  }));

  // Convert Markdown to Blocks
  fastify.post("/convert/markdown/blocks", withErrorHandling(async (request, reply) => {
    const body = request.body as {markdown?: string};

    if (!body.markdown) {
      return reply.status(400).send({
        error: "Missing required field: markdown"
      });
    }

    const blocks = await convertMarkdownToBlocks(body.markdown);

    return {blocks};
  }));

  // Convert Blocks to Markdown
  fastify.post("/convert/blocks/markdown", withErrorHandling(async (request, reply) => {
    const body = request.body as {blocks?: any};

    if (!body.blocks) {
      return reply.status(400).send({
        error: "Missing required field: blocks"
      });
    }

    const markdown = await convertBlocksToMarkdown(body.blocks);

    return {markdown};
  }));

  try {
    await fastify.listen({host, port});
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  return fastify;
}

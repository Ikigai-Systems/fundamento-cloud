import * as Sentry from "@sentry/node";
import Fastify from "fastify";
import FormBodyPlugin from "@fastify/formbody";
import {fastifyRequestContext, /* requestContext */} from '@fastify/request-context';
import {convertToBlocks, convertToYjs, convertMarkdownToBlocks, convertBlocksToMarkdown} from "./converters";
import type {FastifyReply, FastifyRequest, RawReplyDefaultExpression, RawRequestDefaultExpression} from "fastify";
import type {Http2Server} from "node:http2";
import type {Block} from "@blocknote/core";
import {Buffer} from "buffer";

// The server is created with `http2: true`, so requests/replies use the HTTP/2
// raw types rather than Fastify's HTTP/1 defaults. Parameterize over the route
// body so each handler gets a typed `request.body`.
type Http2Request<Body> = FastifyRequest<
  {Body: Body},
  Http2Server,
  RawRequestDefaultExpression<Http2Server>
>;
type Http2Reply = FastifyReply<
  {Body: unknown},
  Http2Server,
  RawRequestDefaultExpression<Http2Server>,
  RawReplyDefaultExpression<Http2Server>
>;

type RouteHandler<Body> = (request: Http2Request<Body>, reply: Http2Reply) => Promise<unknown>;

function withErrorHandling<Body>(handler: RouteHandler<Body>): RouteHandler<Body> {
  return async (request, reply) => {
    return Sentry.withScope(async scope => {
      scope.clearBreadcrumbs();
      try {
        return await handler(request, reply);
      } catch (error) {
        request.log.error(error);
              
        Sentry.captureException(error);
              
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Conversion failed"
        });
      }    
    })
  };
}

export async function startServer(port: number, host: string) {
  // See also https://github.com/Ikigai-Systems/fundamento-cloud/blob/178c96c3817416509322e06bcdfafe8b37f0f4f2/micro-services/formula-eval/src/server.js

  const fastify = Fastify({
    logger: true,
    http2: true,
  });

  fastify.register(FormBodyPlugin);
  fastify.register(fastifyRequestContext);

  Sentry.setupFastifyErrorHandler(fastify);

  // Convert YJS to Blocks
  fastify.post("/convert/yjs/blocks", withErrorHandling<{yjs?: string}>(async (request, reply) => {
    const body = request.body;

    if (!body.yjs) {
      return reply.status(400).send({
        error: "Missing required field: yjs"
      });
    }

    const blocks = convertToBlocks(Buffer.from(body.yjs, "base64"));

    return {blocks};
  }));

  // Convert Blocks to YJS
  fastify.post("/convert/blocks/yjs", withErrorHandling<{blocks?: Block[]}>(async (request, reply) => {
    const body = request.body;

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
  fastify.post("/convert/markdown/blocks", withErrorHandling<{markdown?: string}>(async (request, reply) => {
    const body = request.body;

    if (!body.markdown) {
      return reply.status(400).send({
        error: "Missing required field: markdown"
      });
    }

    const blocks = await convertMarkdownToBlocks(body.markdown);

    return {blocks};
  }));

  // Convert Blocks to Markdown
  fastify.post("/convert/blocks/markdown", withErrorHandling<{blocks?: Block[]}>(async (request, reply) => {
    const body = request.body;

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

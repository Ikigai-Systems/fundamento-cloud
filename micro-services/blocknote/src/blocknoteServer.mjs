import Fastify from 'fastify';
import FormBodyPlugin from '@fastify/formbody'
import {convertToBlocks} from "./convertToBlocks.ts";

const fastify = Fastify({
  logger: true,
  // http2: true,
});
fastify.register(FormBodyPlugin);

// Declare a route
fastify.post("/blocknote/to_blocks", async function handler (request, reply) {
  const {yjs} = request.body;

  const response = {
    blocknote: convertToBlocks(yjs)
  };

  return response;
})

const port = process.env.PORT || 3002;
const host = process.env.HTTP_HOST || "127.0.0.1";

fastify.listen({ host, port }).catch(err => {
  fastify.log.error(err)
  process.exit(1)
});

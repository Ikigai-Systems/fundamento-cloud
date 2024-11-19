import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
  http2: true,
});

// Declare a route
fastify.post('/blocknote/to_blocks', async function handler (request, reply) {
  const {formula, additional_context} = request.body;

  const response = {
    OK: true
  };

  return response.json();
})

try {
  const port = process.env.PORT || 3002;
  const host = process.env.HTTP_HOST || "127.0.0.1";

  await fastify.listen({ host, port })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
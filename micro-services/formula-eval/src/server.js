import Fastify from 'fastify';
import FormBodyPlugin from '@fastify/formbody'

const fastify = Fastify({
  logger: true,
  http2: true,
});
fastify.register(FormBodyPlugin);

// Declare a route
fastify.post('/formulas/eval', async function handler (request, reply) {
  // todo: some kind of authentication for veryfing this is legitimate request from fundamento app

  const {formula, additional_context} = request.body;

  // simulate formula evaluation via round-trip to fundamento formulas_controller.rb:
  const fundamentoFormulasEvalUrl = process.env.FUNDAMENTO_FORMULAS_EVAL_URL || "http://localhost:3000/formulas/eval"
  const response = await fetch(fundamentoFormulasEvalUrl, {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'formula': formula,
      'additional_context': additional_context,
    })
  })
  return await response.json();
})

try {
  const port = process.env.PORT || 3001;
  const host = process.env.HTTP_HOST || "127.0.0.1";

  await fastify.listen({ host, port })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
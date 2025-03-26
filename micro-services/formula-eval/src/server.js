import * as Sentry from "@sentry/node";
import Fastify from 'fastify';
import FormBodyPlugin from '@fastify/formbody';
import {fastifyRequestContext, requestContext} from '@fastify/request-context';
import evaluateFormula from './evaluateFormula.js';

const fastify = Fastify({
  logger: true,
  http2: true,
});
fastify.register(FormBodyPlugin);
fastify.register(fastifyRequestContext);

Sentry.setupFastifyErrorHandler(fastify);

fastify.addHook("onRequest", async (request, reply) => {
  const authorizationHeader = request.headers["authorization"];

  if (!authorizationHeader || !authorizationHeader.startsWith("JWT ")) {
    reply.status(401).send({ error: "Unauthorized" });
    return;
  }

  requestContext.set("authorization", authorizationHeader);
});

fastify.post('/formulas/eval', async function handler (request, reply) {
  return Sentry.withIsolationScope(scope => {
    scope.clearBreadcrumbs();
    // todo: some kind of authentication for verifying this is legitimate request from fundamento app

    const {formula, additional_context, evaluation_context} = request.body;
    requestContext.set("evaluation_context", evaluation_context);

    try {
      const evaluatedFormula = evaluateFormula(formula, additional_context);
      console.log("evaluatedFormula:", evaluatedFormula);
      if (evaluatedFormula === undefined) {
        return({error: "Undefined formula"});
      } else {
        return evaluatedFormula;
      }
    } catch (e) {
      Sentry.captureException(e);
      return({error: e.toString()});
    }
  });
})

fastify.post('/formulas/eval/batch', async function handler (request, reply) {
  return Sentry.withIsolationScope(scope => {
    scope.clearBreadcrumbs();
    // todo: some kind of authentication for veryfing this is legitimate request from fundamento app

    const {evaluations, evaluation_context} = request.body;
    requestContext.set("evaluation_context", evaluation_context);

    return evaluations.map(({formula, additional_context}) => {
      try {
        const evaluatedFormula = evaluateFormula(formula, additional_context);
        console.log("evaluatedFormula:", evaluatedFormula);
        if (evaluatedFormula === undefined) {
          return({error: "Undefined formula"});
        } else {
          return evaluatedFormula;
        }
      } catch (e) {
        Sentry.captureException(e);
        return ({error: e.toString()});
      }
    });
  });
})

try {
  const port = process.env.PORT || 3001;
  const host = process.env.HTTP_HOST || "127.0.0.1";

  await fastify.listen({ host, port })
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
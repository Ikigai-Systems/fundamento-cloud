import {defineFormula} from "./define-formula.js";
import {getUser} from "../fundamento-gateway.js"

import {requestContext} from "@fastify/request-context";

defineFormula("User", (...args) => {
  const userId = args[0] || requestContext.get("evaluation_context").user_id;
  return {result: getUser(userId), commands: []};
})



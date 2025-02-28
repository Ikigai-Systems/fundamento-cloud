import {defineFormula} from "./define-formula.js";

defineFormula("Now", (includeTime) => {
  return {result: new Date(), commands: []};
});

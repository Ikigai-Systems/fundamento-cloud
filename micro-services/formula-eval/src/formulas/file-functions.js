import {defineFormula} from "./define-formula.js";

defineFormula("ParseJSON", (json) => {
  return {result: JSON.parse(json), commands: []};
});

import {defineFormula} from "./define-formula.js";

defineFormula("ParseJSON", (json) => {
  return JSON.parse(json);
});

import {defineFormula} from "./define-formula.js";
import _ from "lodash";

defineFormula("Dig", (object, ...path) => {
  return _.get(object, path);
});

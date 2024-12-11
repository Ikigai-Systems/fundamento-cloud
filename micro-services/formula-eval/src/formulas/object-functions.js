import {defineFormula} from "./define-formula.js";
import _ from "lodash";

defineFormula("Dig", (object, ...path) => {
  return {result: _.get(object, path), commands: []};
});

defineFormula("Equals", (left, right) => {
  return {result: _.isEqual(left, right), commands: []};
})

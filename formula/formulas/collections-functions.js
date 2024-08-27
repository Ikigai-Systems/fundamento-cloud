import {defineFormula} from "./define-formula.js";

import _ from "lodash";

// Define the Find function
defineFormula("Find", (arg1, arg2) => {
  return arg2.indexOf(arg1) !== -1;
});

defineFormula("CountUnique", (...args) => {
  return _.uniq(args).length;
});

defineFormula("List", (...args) => {
  return Array.from(args);
});

defineFormula("First", (...args) => {
  return _.first(args);
});

defineFormula("Last", (...args) => {
  return _.last(args);
});

defineFormula("ForEach", _.map, true);

defineFormula("Filter", _.filter, true);

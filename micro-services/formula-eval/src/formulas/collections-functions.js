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
  return _.first(args[0]);
});

defineFormula("Last", (...args) => {
  return _.last(args[0]);
});

defineFormula("ForEach", _.map, true);

defineFormula("Filter", _.filter, true);

defineFormula("All", _.every, true);

defineFormula("Any", _.some, true);

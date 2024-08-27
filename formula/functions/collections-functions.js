import {defineFunction} from "./define-function.js";

import _ from "lodash";

// Define the Find function
defineFunction("Find", (arg1, arg2) => {
  return arg2.indexOf(arg1) !== -1;
});

defineFunction("CountUnique", (...args) => {
  return _.uniq(args).length;
});
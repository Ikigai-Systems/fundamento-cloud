import {defineFunction} from "./define-function.js";

import _ from "lodash";

// Define the Find function
defineFunction("Find", (arg1, arg2) => {
  return arg2.indexOf(arg1) !== -1;
});

defineFunction("CountUnique", (...args) => {
  return _.uniq(args).length;
});

defineFunction("List", (...args) => {
  return Array.from(args);
});

defineFunction("First", (...args) => {
  return _.first(args);
});

defineFunction("Last", (...args) => {
  return _.last(args);
});

defineFunction("ForEach", (...args) => {
  this.currentValueManager.enterScope();
  try {
    return Array.from(args);
  } finally {
    this.currentValueManager.exitScope();
  }
});

defineFunction("Filter", (...args) => {
  this.currentValueManager.enterScope();
  try {
    this.currentValueManager.declareVariable("currentValue", 5);
    return Array.from(args);
  } finally {
    this.currentValueManager.exitScope();
  }
});

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

defineFormula("ForEach", (...args) => {
  this.currentValueManager.enterScope();
  try {
    return Array.from(args);
  } finally {
    this.currentValueManager.exitScope();
  }
});

defineFormula("Filter", (...args) => {
  this.currentValueManager.enterScope();
  try {
    this.currentValueManager.declareVariable("currentValue", 5);
    return Array.from(args);
  } finally {
    this.currentValueManager.exitScope();
  }
});

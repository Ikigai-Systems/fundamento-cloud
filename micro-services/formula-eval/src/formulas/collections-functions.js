import {defineFormula} from "./define-formula.js";

import _ from "lodash";

// Define the Find function
defineFormula("Find", (arg1, arg2) => {
  return {result: arg2.indexOf(arg1) !== -1, commands: []};
});

defineFormula("IndexOf", (arg1, arg2) => {
  return {result: arg2.indexOf(arg1), commands: []};
});

defineFormula("Unique", (...args) => {
  return {result: _.uniq(args[0]), commands: []};
});

defineFormula("CountUnique", (...args) => {
  return {result: _.uniq(args[0]).length, commands: []};
});

defineFormula("Sum", (...args) => {
  return {result: _.sum(args[0]), commands: []};
});

defineFormula("List", (...args) => {
  return {result: Array.from(args), commands: []};
});

defineFormula("Nth", (list, index) => {
  return {result: _.nth(list, index - 1), commands: []};
});

defineFormula("First", (...args) => {
  return {result: _.first(args[0]), commands: []};
});

defineFormula("Last", (...args) => {
  return {result: _.last(args[0]), commands: []};
});

defineFormula("ForEach", (collection, iteratee) => {
  let commands = [];
  const mapped = _.map(collection, value => {
    const calledIteratee = iteratee(value);
    commands = [...commands, ...calledIteratee.commands];
    return calledIteratee.result;
  });
  return {result: mapped, commands};
}, true);

defineFormula("Filter", (collection, predicate) => {
  let commands = [];
  const filtered = _.filter(collection, value => {
    const calledPredicate = predicate(value);
    commands = [...commands, ...calledPredicate.commands];
    return calledPredicate.result;
  });
  return {result: filtered, commands};
}, true);

defineFormula("All", (collection, predicate) => {
  let commands = [];
  const processed = _.every(collection, value => {
    const calledPredicate = predicate(value);
    commands = [...commands, ...calledPredicate.commands];
    return calledPredicate.result;
  });
  return {result: processed, commands};
}, true);

defineFormula("Any", (collection, predicate) => {
  let commands = [];
  const processed = _.some(collection, value => {
    const calledPredicate = predicate(value);
    commands = [...commands, ...calledPredicate.commands];
    return calledPredicate.result;
  });
  return {result: processed, commands};
}, true);

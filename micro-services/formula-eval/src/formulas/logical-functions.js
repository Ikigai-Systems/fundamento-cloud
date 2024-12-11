import {defineFormula} from "./define-formula.js";

defineFormula("And", (...[arg1, arg2]) => {
  return {result: !!arg1 && !!arg2, commands: []};
});

defineFormula("Not", (value) => {
  return {result: !value, commands: []};
});

defineFormula("Or", (...[arg1, arg2]) => {
  return {result: !!arg1 || !!arg2, commands: []};
});

defineFormula("True", () => {
  return {result: true, commands: []};
});

defineFormula("False", () => {
  return {result: false, commands: []};
});

defineFormula("If", (condition, ifTrue, ifFalse) => {
  if (condition) {
    return {result: ifTrue, commands: []};
  } else {
    return {result: ifFalse, commands: []};
  }
});

defineFormula("IfBlank", (text, ifBlank) => {
  if (text === "") {
    return {result: ifBlank, commands: []};
  } else {
    return {result: text, commands: []};
  }
});
import {defineFormula} from "./define-formula.js";

defineFormula("And", (...[arg1, arg2]) => {
  return !!arg1 && !!arg2;
});

defineFormula("Not", (value) => {
  return !value;
});

defineFormula("Or", (...[arg1, arg2]) => {
  return !!arg1 || !!arg2;
});

defineFormula("True", () => {
  return true;
});

defineFormula("False", () => {
  return false;
});

defineFormula("If", (condition, ifTrue, ifFalse) => {
  if (condition) {
    return ifTrue;
  } else {
    return ifFalse;
  }
});

defineFormula("IfBlank", (text, ifBlank) => {
  if (text === "") {
    return ifBlank;
  } else {
    return text;
  }
});
import {defineFunction} from "./define-function.js";

defineFunction("And", (...[arg1, arg2]) => {
  return !!arg1 && !!arg2;
});

defineFunction("Not", (value) => {
  return !value;
});

defineFunction("Or", (...[arg1, arg2]) => {
  return !!arg1 || !!arg2;
});

defineFunction("True", () => {
  return true;
});

defineFunction("False", () => {
  return false;
});

defineFunction("If", (condition, ifTrue, ifFalse) => {
  if (condition) {
    return ifTrue;
  } else {
    return ifFalse;
  }
});

defineFunction("IfBlank", (text, ifBlank) => {
  if (text === "") {
    return ifBlank;
  } else {
    return text;
  }
});
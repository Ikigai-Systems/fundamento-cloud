import {defineAction} from "./define-formula.js";

defineAction("RunActions", (...args) => {
  return {
    results: null,
    commands: []
  };
});

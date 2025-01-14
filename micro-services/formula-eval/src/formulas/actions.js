import {defineAction} from "./define-formula.js";

defineAction("RunActions", (commands) => {
  return {
    commands: [
      { type: "RunActions", commands: []}
    ]
  };
});

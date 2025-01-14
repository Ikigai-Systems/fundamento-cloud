import {defineCommand} from "./define-formula.js";

defineCommand("RunActions", (commands) => {
  return {
    commands: [
      { type: "RunActions", commands: []}
    ]
  };
});

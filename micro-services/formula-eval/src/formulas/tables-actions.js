import {defineAction} from "./define-formula.js";

import _ from "lodash";

defineAction("AddRow", (tableNpi, ...args) => {
  return {commands: [{type: "AddRow", tableNpi: tableNpi, values: _.fromPairs(_.chunk(args, 2))}]};
});

defineAction("DeleteRows", (...args) => {
  return {commands: [{type: "DeleteRows", tableNpi: args[0]}]};
});

defineAction("AddOrUpdateRows", (tableNpi, conditionFormula, ...args) => {
  return {commands: [{type: "AddOrUpdateRows", tableNpi: tableNpi, conditionFormula, values: _.fromPairs(_.chunk(args, 2))}]};
});

defineAction("UpdateRows", (tableNpi, conditionFormula, ...args) => {
  return {commands: [{type: "UpdateRows", tableNpi: tableNpi, conditionFormula, values: _.fromPairs(_.chunk(args, 2))}]};
});
import {defineCommand} from "./define-formula.js";

import _ from "lodash";

defineCommand("AddRow", (tableNpi, ...args) => {
  return {commands: [{type: "AddRow", tableNpi: tableNpi, values: _.fromPairs(_.chunk(args, 2))}]};
});

defineCommand("DeleteRows", (...args) => {
  return {commands: [{type: "DeleteRows", tableNpi: args[0]}]};
});

defineCommand("AddOrUpdateRows", (...args) => {
  return {commands: [{type: "AddOrUpdateRows", tableNpi: args[0], conditionFormula: args[1], columnName: args[2], columnValue: args[3]}]};
});
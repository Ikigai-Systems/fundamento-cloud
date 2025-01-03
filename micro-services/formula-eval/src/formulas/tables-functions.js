import {defineFormula} from "./define-formula.js";
import {getTable} from "../fundamento-gateway.js"

import _ from "lodash";

function CurrentRow(columnName = null) {
  if (!this.currentRow) throw new Error("Current row is not available in this context");

  return {result: columnName ? _.get(this.currentRow, columnName) : this.currentRow, commands: []};
}

defineFormula("Table", (...args) => {
  return {result: getTable(args[0]), commands: []};
})

defineFormula("AddRow", (...args) => {
  return {commands: [{type: "AddRow", tableNpi: args[0]}]};
});

defineFormula("DeleteRows", (...args) => {
  return {commands: [{type: "DeleteRows", tableNpi: args[0]}]};
});

defineFormula("AddOrUpdateRows", (...args) => {
  return {commands: [{type: "AddOrUpdateRows", tableNpi: args[0], conditionFormula: args[1], columnName: args[2], columnValue: args[3]}]};
});

defineFormula("CurrentRow", CurrentRow);

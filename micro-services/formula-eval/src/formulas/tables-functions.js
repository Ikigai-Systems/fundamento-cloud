import {defineFormula} from "./define-formula.js";
import {getTable} from "../fundamento-gateway.js"

import _ from "lodash";

function CurrentRow(columnName = null) {
  if (!this.currentRow) throw new Error("Current row is not available in this context");

  return columnName ? _.get(this.currentRow, columnName) : this.currentRow;
}

defineFormula("Table", (...args) => {
  return getTable(args[0]);
})

defineFormula("AddRow", (...args) => {
  // todo: validate if tableId is valid id ? should formula-eval micro-service be responsible for validation of the input formulas?
  return {commands: [{type: "AddRow", tableId: args[0]}]};
});

defineFormula("DeleteRows", (...args) => {
  // todo: validate if tableId is valid id ? should formula-eval micro-service be responsible for validation of the input formulas?
  return {commands: [{type: "DeleteRows", tableId: args[0]}]};
});

defineFormula("AddOrUpdateRows", (...args) => {
  // todo: validate if tableId is valid id ? should formula-eval micro-service be responsible for validation of the input formulas?
  return {commands: [{type: "AddOrUpdateRows", tableId: args[0], conditionFormula: args[1], columnName: args[2], columnValue: args[3]}]};
});

defineFormula("CurrentRow", CurrentRow);

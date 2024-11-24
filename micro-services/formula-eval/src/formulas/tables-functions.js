import {defineFormula} from "./define-formula.js";

import _ from "lodash";

function CurrentRow(columnName = null) {
  if (!this.currentRow) throw new Error("Current row is not available in this context");

  return columnName ? _.get(this.currentRow, columnName) : this.currentRow;
}

defineFormula("AddRow", (...args) => {
  // todo: validate if tableId is valid id ? should formula-eval micro-service be responsible for validation of the input formulas?
  return {value: _.uniq(args).length, commands: [{type: "AddRow", tableId: args[0]}]};
});

defineFormula("CurrentRow", CurrentRow);

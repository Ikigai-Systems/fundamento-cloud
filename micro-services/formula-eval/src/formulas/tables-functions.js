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

defineFormula("CurrentRow", CurrentRow);

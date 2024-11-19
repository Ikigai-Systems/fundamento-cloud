import {defineFormula} from "./define-formula.js";

import _ from "lodash";

function CurrentRow(columnName = null) {
  if (!this.currentRow) throw new Error("Current row is not available in this context");

  return columnName ? _.get(this.currentRow, columnName) : this.currentRow;
}

defineFormula("CurrentRow", CurrentRow);

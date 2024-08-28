// string.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe('String related formulas', () => {
  describe('CurrentRow', () => {
    testFormula(`Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))`, "JIRA Jira", {
      currentRow: {
        "Name": "Jira",
        "Key": "JIRA",
      }
    });
  });
});
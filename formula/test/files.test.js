// string.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe('File related formulas', () => {
  describe('ParseJSON', () => {
    const json = `{
      "Name": "Jira",
      "Key": "JIRA"
    }`;

    testFormula(`ParseJSON(${JSON.stringify(json)})`, JSON.parse(json));
  });
});
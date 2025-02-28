import {describe, it} from "mocha";
import {expect} from "chai";
import evaluateFormula from "../src/evaluateFormula.js";

describe("Date functions", () => {
  describe("Now", () => {
    it(`evaluates Now`, () => {
      const now = evaluateFormula("Now()").result;

      expect(Date.now() - now).to.lt(20000);
    });
  });
});
import {evaluateFormula} from "../index.mjs";
import {expect} from "chai";
import {describe, it} from "mocha";

describe('String related formulas', () => {
  describe('Join', () => {
    it('works', () => {
      const result = evaluateFormula(`Join("-", "This", "is", "Awesome")`);

      expect(result).to.deep.equal([["This-is-Awesome"]]);
    });
  });
});

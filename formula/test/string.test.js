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

  describe('ContainsText', () => {
    it('works', () => {
      expect(evaluateFormula(`ContainsText("a needle in the haystack", "needle")`)).
        to.deep.equal([[true]]);

      expect(evaluateFormula(`ContainsText("Trippers and askers surround me", "trip")`)).
        to.deep.equal([[false]]);

      expect(evaluateFormula(`ContainsText("But they are not the Me myself", "me", True())`)).
        to.deep.equal([[true]]);

      expect(evaluateFormula(`ContainsText("crème fraîche", "creme", False(), True())`)).
        to.deep.equal([[true]]);
    });
  });

  describe('EndsWith', () => {
    it('works', () => {
      expect(evaluateFormula(`EndsWith("Hello world", "Find me")`)).
        to.deep.equal([[false]]);

      expect(evaluateFormula(`EndsWith("Hello world", "world")
`)).
        to.deep.equal([[true]]);

      expect(evaluateFormula(`EndsWith("Hello World", "world", True())
`)).
        to.deep.equal([[true]]);

      expect(evaluateFormula(`EndsWith("Hej världen", "varlden", False(), True())
`)).
        to.deep.equal([[true]]);
    });
  });

  describe('StartsWith', () => {
    it('works', () => {
      expect(evaluateFormula(`StartsWith("Hello world", "Find me")`)).
        to.deep.equal([[false]]);

      expect(evaluateFormula(`StartsWith("Hello world", "Hello")
`)).
        to.deep.equal([[true]]);

      expect(evaluateFormula(`StartsWith("Hello World", "hello", True())
`)).
        to.deep.equal([[true]]);

      expect(evaluateFormula(`StartsWith("Hej världen", "Hej var", False(), True())
`)).
        to.deep.equal([[true]]);
    });
  });
});

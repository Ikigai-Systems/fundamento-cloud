import {evaluateFormula} from "../index.mjs";
import {expect} from "chai";
import {describe, it} from "mocha";

describe('Find Function', () => {
  it('should return true if the first argument is found in the second argument', () => {
    const result = evaluateFormula("Find(\"world\", \"hello world\")");
    expect(result).to.deep.equal([[true]]);
  });

  it('should return false if the first argument is not found in the second argument', () => {
    const result = evaluateFormula(`Find("world", "hello")`);
    expect(result).to.deep.equal([[false]]);
  });
});
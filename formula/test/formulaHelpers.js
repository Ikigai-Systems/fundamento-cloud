// testHelpers.js
import {expect} from "chai";
import {evaluateFormula} from "../index.mjs";
import {it} from "mocha";

export function testFormula(formula, expectedResult, context = {}) {
  it(`evaluates ${formula}`, () => {
    expect(evaluateFormula(formula, context)).to.deep.equal(expectedResult);
  });
}
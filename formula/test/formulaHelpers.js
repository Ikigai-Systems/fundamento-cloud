// testHelpers.js
import {expect} from "chai";
import {evaluateFormula} from "../index.mjs";
import {it} from "mocha";

export function testFormula(formula, expectedResult) {
  it(`evaluates ${formula}`, () => {
    expect(evaluateFormula(formula)).to.deep.equal(expectedResult);
  });
}
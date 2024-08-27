// formula.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe('Find Function', () => {
  testFormula(`Find("world", "hello world")`, [[true]]);
  testFormula(`Find("world", "hello")`, [[false]]);
});

describe('CountUnique Function', () => {
  testFormula(`CountUnique(1, 2, 3, 3, 3, 4)`, [[4]]);
  testFormula(`CountUnique(1, 2, 3, 4)`, [[4]]);
  testFormula(`CountUnique(1, 1, 2, 2)`, [[2]]);
  testFormula(`CountUnique("world", "world", "hello")`, [[2]]);
});

describe('Expressions', () => {
  testFormula(`3 * 5`, [[15]]);
  testFormula(`3 - 5`, [[-2]]);
  testFormula(`(2*3)`, [[6]]);
  testFormula(`(2*2)/(4+4)`, [[0.5]]);
});


// describe('Nesting Functions', () => {
//   it('should count only unique arguments', () => {
//     const result = evaluateFormula(`CountUnique(1, 2, 3, 3, 3, 4)`);
//
//     expect(result).to.deep.equal([[4]]);
//   });
//
//   it('should handle different arguments', () => {
//     const result = evaluateFormula(`CountUnique("world", "world", "hello")`);
//
//     expect(result).to.deep.equal([[2]]);
//   });
// });
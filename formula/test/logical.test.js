// formula.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe('And', () => {
  testFormula(`And(True(), True())`, [[true]]);
  testFormula(`And(True(), False())`, [[false]]);
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
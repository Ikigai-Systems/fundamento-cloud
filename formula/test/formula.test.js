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

describe('CountUnique Function', () => {
  it('should count only unique arguments', () => {
    const someAreUnique = evaluateFormula(`CountUnique(1, 2, 3, 3, 3, 4)`);

    expect(someAreUnique).to.deep.equal([[4]]);

    const allAreUnique = evaluateFormula(`CountUnique(1, 2, 3, 4)`);

    expect(allAreUnique).to.deep.equal([[4]]);

    const noneAreUnique = evaluateFormula(`CountUnique(1, 1, 2, 2)`);

    expect(noneAreUnique).to.deep.equal([[2]]);
  });

  it('should handle different arguments', () => {
    const result = evaluateFormula(`CountUnique("world", "world", "hello")`);

    expect(result).to.deep.equal([[2]]);
  });
});

describe('And Function', () => {
  it('returns true', () => {
    const result = evaluateFormula(`And(True(), True())`);

    expect(result).to.deep.equal([[true]]);
  });

  it('returns false', () => {
    const result = evaluateFormula(`And(True(), False())`);

    expect(result).to.deep.equal([[false]]);
  });
});

describe('Expressions', () => {
  it('supports multiplication', () => {
    const result = evaluateFormula(`3 * 5`);

    expect(result).to.deep.equal([[15]]);
  });

  it('supports subtraction', () => {
    const result = evaluateFormula(`3 - 5`);

    expect(result).to.deep.equal([[-2]]);
  });

  it("handles parentheses", () => {
    const singleBrackets = evaluateFormula(`(2*3)`);

    expect(singleBrackets).to.deep.equal([[6]])

    const result = evaluateFormula(`(2*2)/(4+4)`);

    expect(result).to.deep.equal([[0.5]])
  })
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
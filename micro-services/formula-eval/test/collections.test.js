// formula.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe("Collection formulas", () => {
  describe('Find Function', () => {
    testFormula(`Find("world", "hello world")`, true);
    testFormula(`Find("world", "hello")`, false);
  });

  describe('CountUnique Function', () => {
    testFormula(`CountUnique(List(1, 2, 3, 3, 3, 4))`, 4);
    testFormula(`CountUnique(List(1, 2, 3, 4))`, 4);
    testFormula(`CountUnique(List(1, 1, 2, 2))`, 2);
    testFormula(`CountUnique(List("world", "world", "hello"))`, 2);
  });

  describe('List', () => {
    testFormula(`List(1, 2, 3, 3, 3, 4)`, [1, 2, 3, 3, 3, 4]);
  });

  describe('Filter', () => {
    testFormula(`Filter(List(1, 2, 3, 3, 3, 4), CurrentValue >= 3)`, [3, 3, 3, 4]);
  });

  describe("ForEach", () => {
    testFormula(`ForEach(List("Dog", "Cat"), Upper(CurrentValue))`, ["DOG", "CAT"])
  });

  describe("All", () => {
    testFormula(`All(List(1, 2, 3, 3, 3, 4), CurrentValue >= 3)`, false);
    testFormula(`All(List(1, 2, 3, 3, 3, 4), CurrentValue >= 0)`, true);
  });

  describe("Any", () => {
    testFormula(`Any(List(1, 2, 3, 3, 3, 4), CurrentValue < 0)`, false);
    testFormula(`Any(List(1, 2, 3, 3, 3, 4), CurrentValue >= 3)`, true);
  });

  describe('First', () => {
    testFormula(`First(List(1, 2, 3, 3, 3, 4))`, 1);
    testFormula(`First(List(1))`, 1);
  });

  describe('Last', () => {
    testFormula(`Last(List(1, 2, 3, 3, 3, 4))`, 4);
    testFormula(`Last(List(1))`, 1);
  });

  describe('Nth', () => {
    testFormula(`Nth(List(1, 2, 3, 3, 3, 4), 2)`, 2);
    testFormula(`Nth(List(1), 1)`, 1);
    testFormula(`Nth(List(1), 10)`, undefined);
  });

  describe('Sum', () => {
    testFormula(`Sum(List(1,2,3,4))`, 10);
  });
});

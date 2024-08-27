// formula.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe("Collection formulas", () => {
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

  describe('List', () => {
    testFormula(`List(1, 2, 3, 3, 3, 4)`, [[[1, 2, 3, 3, 3, 4]]]);
  });

  describe('Filter', () => {
    testFormula(`Filter(List(1, 2, 3, 3, 3, 4), CurrentValue >= 3)`, [[[3, 3, 3, 4]]]);
  });

  describe("ForEach", () => {
    testFormula(`ForEach(List("Dog", "Cat"), Upper(CurrentValue))`, [[["DOG", "CAT"]]])
  });

  describe("All", () => {
    testFormula(`All(List(1, 2, 3, 3, 3, 4), CurrentValue >= 3)`, [[false]]);
    testFormula(`All(List(1, 2, 3, 3, 3, 4), CurrentValue >= 0)`, [[true]]);
  });

  describe("Any", () => {
    testFormula(`Any(List(1, 2, 3, 3, 3, 4), CurrentValue < 0)`, [[false]]);
    testFormula(`Any(List(1, 2, 3, 3, 3, 4), CurrentValue >= 3)`, [[true]]);
  });

  describe('First', () => {
    testFormula(`First(1, 2, 3, 3, 3, 4)`, [[1]]);
    testFormula(`First(1)`, [[1]]);
  });

  describe('Last', () => {
    testFormula(`Last(1, 2, 3, 3, 3, 4)`, [[4]]);
    testFormula(`Last(1)`, [[1]]);
  });
});

// formula.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe("Logical formulas", () => {
  describe('And', () => {
    testFormula(`And(True(), True())`, [[true]]);
    testFormula(`And(True(), False())`, [[false]]);
  });

  describe('Or', () => {
    testFormula(`Or(True(), True())`, [[true]]);
    testFormula(`Or(True(), False())`, [[true]]);
    testFormula(`Or(False(), False())`, [[false]]);
  });

  describe('True', () => {
    testFormula(`True()`, [[true]]);
  });

  describe('False', () => {
    testFormula(`False()`, [[false]]);
  });

  describe('If', () => {
    testFormula(`If(True(), "That's true", "That's not true")`, [["That's true"]]);
    testFormula(`If(False(), "That's true", "That's not true")`, [["That's not true"]]);

    testFormula(`If(6 > 5, "6 is more than 5", "That's not correct")`, [["6 is more than 5"]]);
    testFormula(`If(6 < 5, "6 is more than 5", "That's not correct")`, [["That's not correct"]]);

    testFormula(`If(6 == 5, "That's correct", "That's not correct")`, [["That's not correct"]]);
    testFormula(`If(6 != 5, "That's correct", "That's not correct")`, [["That's correct"]]);
  });

  describe('IfBlank', () => {
    testFormula(`IfBlank("", "Default if blank")`, [["Default if blank"]]);
    testFormula(`IfBlank("Hello world", "Default if blank")`, [["Hello world"]]);
  });

  describe('Not', () => {
    testFormula(`Not(True())`, [[false]]);
    testFormula(`Not(False())`, [[true]]);
  });
});

// string.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe('String related formulas', () => {
  describe('Join', () => {
    testFormula(`Join("-", "This", "is", "Awesome")`, [["This-is-Awesome"]]);
  });

  describe('ContainsText', () => {
    testFormula(`ContainsText("a needle in the haystack", "needle")`, [[true]]);
    testFormula(`ContainsText("Trippers and askers surround me", "trip")`, [[false]]);
    testFormula(`ContainsText("But they are not the Me myself", "me", True())`, [[true]]);
    testFormula(`ContainsText("crème fraîche", "creme", False(), True())`, [[true]]);
  });

  describe('EndsWith', () => {
    testFormula(`EndsWith("Hello world", "Find me")`, [[false]]);
    testFormula(`EndsWith("Hello world", "world")`, [[true]]);
    testFormula(`EndsWith("Hello World", "world", True())`, [[true]]);
    testFormula(`EndsWith("Hej världen", "varlden", False(), True())`, [[true]]);
  });

  describe('StartsWith', () => {
    testFormula(`StartsWith("Hello world", "Find me")`, [[false]]);
    testFormula(`StartsWith("Hello world", "Hello")`, [[true]]);
    testFormula(`StartsWith("Hello World", "hello", True())`, [[true]]);
    testFormula(`StartsWith("Hej världen", "Hej var", False(), True())`, [[true]]);
  });
});
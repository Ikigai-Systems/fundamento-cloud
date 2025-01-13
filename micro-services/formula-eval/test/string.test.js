// string.test.js
import { describe } from "mocha";
import { testFormula } from "./formulaHelpers.js";

describe('String related formulas', () => {
  describe('Join', () => {
    testFormula(`Join("-", "This", "is", "Awesome")`, "This-is-Awesome");
    testFormula(`Join(", ", "This", "is", "Awesome")`, "This, is, Awesome");
    testFormula(`Join("| ", List("This", "is", "Awesome"))`, "This| is| Awesome");
  });

  describe('Concatenate', () => {
    testFormula(`Concatenate("This", "Is", "Awesome")`, "ThisIsAwesome");
    testFormula(`Concatenate(List("This", "Is", "Awesome"))`, "ThisIsAwesome");
  });

  describe('ContainsText', () => {
    testFormula(`ContainsText("a needle in the haystack", "needle")`, true);
    testFormula(`ContainsText("Trippers and askers surround me", "trip")`, false);
    testFormula(`ContainsText("But they are not the Me myself", "me", True())`, true);
    testFormula(`ContainsText("crème fraîche", "creme", False(), True())`, true);
  });

  describe('EndsWith', () => {
    testFormula(`EndsWith("Hello world", "Find me")`, false);
    testFormula(`EndsWith("Hello world", "world")`, true);
    testFormula(`EndsWith("Hello World", "world", True())`, true);
    testFormula(`EndsWith("Hej världen", "varlden", False(), True())`, true);
  });

  describe('StartsWith', () => {
    testFormula(`StartsWith("Hello world", "Find me")`, false);
    testFormula(`StartsWith("Hello world", "Hello")`, true);
    testFormula(`StartsWith("Hello World", "hello", True())`, true);
    testFormula(`StartsWith("Hej världen", "Hej var", False(), True())`, true);
  });

  describe('Substitute', () => {
    testFormula(`Substitute("Hello world", "Hello", "Good morning")`, "Good morning world");
    testFormula(`Substitute("ho ho ho", "ho", "yo")`, "yo ho ho");
  });

  describe('SubstituteAll', () => {
    testFormula(`SubstituteAll("The Cat in the Hat", "at", "orn")`, "The Corn in the Horn");
    testFormula(`SubstituteAll("ho ho ho", "ho", "yo")`, "yo yo yo");
  });

  describe('Upper', () => {
    testFormula(`Upper("hello WORLD")`, "HELLO WORLD");
  });

  describe('Lower', () => {
    testFormula(`Lower("hello WORLD")`, "hello world");
  });

  describe('Number', () => {
    testFormula(`Number(5)`, 5);
  });
});
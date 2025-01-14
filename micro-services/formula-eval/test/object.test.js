import { describe, it } from "mocha";
import {expect} from "chai";
import evaluateFormula from "../src/evaluateFormula.js";
import { testFormula } from "./formulaHelpers.js";
import {fileFixture} from "./fixtureHelpers.js";

describe("Dig", () => {
  it("gets different fields from an object", () => {
    const jsonToParse = fileFixture("metabase-webhook.json");

    expect(
      evaluateFormula(
        `Dig(ParseJSON(${JSON.stringify(jsonToParse)}), "data", "raw_data", "cols")`,
        {json: JSON.parse(jsonToParse)}
      ).result
    ).to.deep.equal(["week_start", "sum"]);
  });

  describe('Equals', () => {
    testFormula('Equals(2, 1+1)', true);
    testFormula('Equals(2, True())', false);
  })
});
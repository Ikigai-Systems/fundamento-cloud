import { describe, it } from "mocha";
import * as fs from "node:fs";
import {expect} from "chai";
import evaluateFormula from "../src/evaluateFormula.js";
import { testFormula } from "./formulaHelpers.js";

describe("Dig", () => {
  it("gets different fields from an object", () => {
    const jsonToParse = fs.readFileSync(`./test/fixtures/metabase-webhook.json`).toString("utf8");

    expect(
      evaluateFormula(
        `Dig(ParseJSON(${JSON.stringify(jsonToParse)}), "data", "raw_data", "cols")`,
        {json: JSON.parse(jsonToParse)}
      )
    ).to.deep.equal(["week_start", "sum"]);
  });

  describe('Equals', () => {
    testFormula('Equals(2, 1+1)', true);
    testFormula('Equals(2, True())', false);
  })
});
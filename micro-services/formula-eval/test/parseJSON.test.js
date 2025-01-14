import { describe, it } from "mocha";
import {expect} from "chai";
import evaluateFormula from "../src/evaluateFormula.js";
import {fileFixture} from "./fixtureHelpers.js";

describe("ParseJSON", () => {
  it("parses it", () => {
    const jsonToParse = fileFixture("metabase-webhook.json");

    expect(
      evaluateFormula(
        `ParseJSON(${JSON.stringify(jsonToParse)})`,
        {}
      ).result
    ).to.deep.equal(JSON.parse(jsonToParse));
  });
});
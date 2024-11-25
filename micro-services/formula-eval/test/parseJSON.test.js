import { describe, it } from "mocha";
import * as fs from "node:fs";
import {expect} from "chai";
import evaluateFormula from "../src/evaluateFormula.js";

describe("ParseJSON", () => {
  it("parses it", () => {
    const jsonToParse = fs.readFileSync(`./test/fixtures/metabase-webhook.json`).toString("utf8");

    expect(
      evaluateFormula(
        `ParseJSON(${JSON.stringify(jsonToParse)})`,
        {}
      )
    ).to.deep.equal(JSON.parse(jsonToParse));
  });
});
import { describe, it } from "mocha";
import * as fs from "node:fs";
import {expect} from "chai";
import evaluateFormula from "../src/evaluateFormula.js";

describe("references", () => {
  it("allow accessing additional context", () => {
    const jsonToParse = fs.readFileSync(`./test/fixtures/metabase-webhook.json`).toString("utf8");

    expect(
      evaluateFormula(
        `[WebhookBody]`,
        {
          "WebhookBody": JSON.parse(jsonToParse)
        }
      ).result
    ).to.deep.equal(JSON.parse(jsonToParse));
  });

  it("can be used as formula arguments", () => {
    const jsonToParse = fs.readFileSync(`./test/fixtures/metabase-webhook.json`).toString("utf8");

    expect(
      evaluateFormula(
        `ParseJSON([WebhookBody])`,
        {
          "WebhookBody": jsonToParse
        }
      ).result
    ).to.deep.equal(JSON.parse(jsonToParse));
  });

  it("returns error for undefined", () => {
    expect(() => {
      evaluateFormula(
        `[WebhookBody]`,
        {}
      )
    }
    ).to.throw("Unrecognized reference found WebhookBody");
  });
});
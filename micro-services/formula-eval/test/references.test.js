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

  it("", () => {
    const jsonToParse = fs.readFileSync(`./test/fixtures/metabase-webhook.json`).toString("utf8");

    expect(
      evaluateFormula(
        `Dig(ParseJSON([WebhookBody]), "data", "raw_data", "rows")`,
        {
          "WebhookBody": jsonToParse
        }
      ).result
    ).to.deep.equal([
      [
        "2024-07-07T00:00:00+02:00",
        2
      ],
      [
        "2024-07-14T00:00:00+02:00",
        2
      ],
      [
        "2024-07-21T00:00:00+02:00",
        2
      ],
      [
        "2024-07-28T00:00:00+02:00",
        2
      ],
      [
        "2024-08-04T00:00:00+02:00",
        3
      ],
      [
        "2024-08-11T00:00:00+02:00",
        3
      ],
      [
        "2024-08-18T00:00:00+02:00",
        3
      ],
      [
        "2024-08-25T00:00:00+02:00",
        3
      ],
      [
        "2024-09-01T00:00:00+02:00",
        3
      ],
      [
        "2024-09-08T00:00:00+02:00",
        3
      ],
      [
        "2024-09-15T00:00:00+02:00",
        3
      ],
      [
        "2024-09-22T00:00:00+02:00",
        3
      ],
      [
        "2024-09-29T00:00:00+02:00",
        3
      ],
      [
        "2024-10-06T00:00:00+02:00",
        3
      ],
      [
        "2024-10-13T00:00:00+02:00",
        4
      ],
      [
        "2024-10-20T00:00:00+02:00",
        6
      ],
      [
        "2024-10-27T00:00:00+02:00",
        7
      ],
      [
        "2024-11-03T00:00:00+01:00",
        8
      ],
      [
        "2024-11-10T00:00:00+01:00",
        9
      ],
      [
        "2024-11-17T00:00:00+01:00",
        12
      ],
    ]);
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
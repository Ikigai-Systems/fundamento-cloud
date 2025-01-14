// string.test.js
import { describe } from "mocha";
import {testAction, testFormula} from "./formulaHelpers.js";
import * as fs from "node:fs";

describe("Table related formulas", () => {
  describe("CurrentRow", () => {
    testFormula(`Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))`, "JIRA Jira", {
      currentRow: {
        "Name": "Jira",
        "Key": "JIRA",
      }
    });
  });

  describe("AddRow with positional arguments", () => {
    testAction(`AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))`, [
      { type: "AddRow", tableNpi: "npi" }
    ], {
      currentRow: {
        "Name": "Jira",
        "Key": "JIRA",
      }
    });
  });

  describe("AddRow with object", () => {
    const webhookBody = JSON.parse(fs.readFileSync(`./test/fixtures/metabase-webhook.json`).toString("utf8"));

    testAction(`AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))`, [
      { type: "AddRow", tableNpi: "npi" }
    ], {
      currentRow: {
        "Name": "Jira",
        "Key": "JIRA",
      },
      "WebhookBody": webhookBody
    });
  });
});
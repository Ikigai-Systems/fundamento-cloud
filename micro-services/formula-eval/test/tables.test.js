// string.test.js
import { describe } from "mocha";
import {testAction, testFormula} from "./formulaHelpers.js";
import {jsonFixture} from "./fixtureHelpers.js";

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
    const webhookBody = jsonFixture("metabase-webhook.json");

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
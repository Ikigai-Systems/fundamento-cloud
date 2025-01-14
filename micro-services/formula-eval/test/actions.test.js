// string.test.js
import { describe } from "mocha";
import {testAction} from "./formulaHelpers.js";

describe("Actions", () => {
  describe("RunActions", () => {
    testAction(`RunActions(
    DeleteRows("npi"),
    RunActions(
      AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name"))),
      AddRow("npi", "column_npi", Concatenate(CurrentRow("Key"), " ", CurrentRow("Name")))
    )
    )`, [
      {
        "tableNpi": "npi",
        "type": "DeleteRows"
      },
      {
        type: "AddRow",
        tableNpi: "npi",
        "values": {
          "column_npi": "JIRA Jira"
        },
      },
      {
        type: "AddRow",
        tableNpi: "npi",
        "values": {
          "column_npi": "JIRA Jira"
        }
      }
    ], {
      currentRow: {
        "Name": "Jira",
        "Key": "JIRA",
      }
    });
  });
});
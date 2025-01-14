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

  describe("AddRow with object", () => {
    const webhookBody = jsonFixture("metabase-webhook.json");

    testAction(`ForEach(Dig([WebhookBody], "data", "raw_data", "rows"), AddRow("npi", "column_npi", First(CurrentValue), "another_npi", Last(CurrentValue)))`, [
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 2,
          "column_npi": "2024-07-07T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 2,
          "column_npi": "2024-07-14T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 2,
          "column_npi": "2024-07-21T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 2,
          "column_npi": "2024-07-28T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-08-04T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-08-11T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-08-18T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-08-25T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-09-01T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-09-08T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-09-15T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-09-22T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-09-29T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 3,
          "column_npi": "2024-10-06T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 4,
          "column_npi": "2024-10-13T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 6,
          "column_npi": "2024-10-20T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 7,
          "column_npi": "2024-10-27T00:00:00+02:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 8,
          "column_npi": "2024-11-03T00:00:00+01:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 9,
          "column_npi": "2024-11-10T00:00:00+01:00"
        }
      },
      {
        "tableNpi": "npi",
        "type": "AddRow",
        "values": {
          "another_npi": 12,
          "column_npi": "2024-11-17T00:00:00+01:00"
        }
      }
    ], {
      "WebhookBody": webhookBody
    });
  });
});
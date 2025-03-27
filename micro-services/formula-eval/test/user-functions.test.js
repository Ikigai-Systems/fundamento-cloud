import {describe} from "mocha";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import {testFormula} from "./formulaHelpers.js";
import {requestContext} from "@fastify/request-context";

describe("User functions", () => {
  beforeEach(() => {
    const requestContextStore = {}
    requestContext.set = (key, value) => {
      requestContextStore[key] = value;
    }

    requestContext.get = (key) => {
      return requestContextStore[key];
    }

    requestContext.set("evaluation_context", {
      user_id: "3",
    });

    const mock = new AxiosMockAdapter(axios);

    mock.onGet("http://localhost:3000/api/v1/users/3").reply(200, {
      "id":3,
      "email":"pawel.nowak@random.pl",
      "organization_role":0,
      "created_at":"2025-02-03T21:33:04.187Z",
      "updated_at":"2025-03-27T11:42:03.149Z",
      "first_name": "Pawel",
      "last_name":"Nowak",
    });

    mock.onGet("http://localhost:3000/api/v1/users/123").reply(404, "'123' is invalid user reference");
  });

  describe('User', () => {
    testFormula(`Dig(User(3), "display_name")`, "Pawel Nowak");
    testFormula(`Dig(User(), "display_name")`, "Pawel Nowak");
    testFormula(`Dig(User(123), "display_name")`, undefined);
    testFormula(`User(123)`, "'123' is invalid user reference");
  });
});
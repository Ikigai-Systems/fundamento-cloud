import deasync from "deasync";
import {requestContext} from '@fastify/request-context';
import axios from "axios";

async function fetchFromFundamento(url, callback) {
  const evaluationContext = requestContext.get("evaluation_context");
  console.log(`fetching from fundamento ${url}...`)
  try {
    const response = await axios.get(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": requestContext.get("authorization"),
      },
      params: {
        evaluationContext: evaluationContext
      }
    });
    return callback && callback(null, response.data);
  } catch (e) {
    return callback && callback(e, null);
  }
}

const fundamentoBaseUrl = process.env.FUNDAMENTO_BASE_URL || "http://localhost:3000";

export const getTable = (tableNpiOrName) => {
  const cacheKey = `tables/${tableNpiOrName}`;
  const cachedResponse = requestContext.get(cacheKey);
  if (cachedResponse !== undefined) {
    return cachedResponse;
  }

  const response = deasync(fetchFromFundamento)(`${fundamentoBaseUrl}/api/v1/tables/${tableNpiOrName}`);
  const {rows, columns} = response.data;
  const refinedResponse = rows.map(row => {
    const cell_values = {};
    columns.forEach(column => {
      cell_values[column.name] = row[column.npi];
    });
    return {...cell_values, ...row}
  });
  requestContext.set(cacheKey, refinedResponse);

  return refinedResponse;
};

export const getUser = (userId) => {
  const cacheKey = `users/${userId}`;
  const cachedResponse = requestContext.get(cacheKey);
  if (cachedResponse !== undefined) {
    return cachedResponse;
  }

  try {
    const response = deasync(fetchFromFundamento)(`${fundamentoBaseUrl}/api/v1/users/${userId}`);
    if (response && response.first_name && response.last_name) {
      response.display_name = `${response.first_name} ${response.last_name}`;
    }
    requestContext.set(cacheKey, response);
  } catch (e) {
    if (e.status === 404) {
      requestContext.set(cacheKey, e.response.data)
    } else {
      throw e
    }
  }
  return requestContext.get(cacheKey);
};

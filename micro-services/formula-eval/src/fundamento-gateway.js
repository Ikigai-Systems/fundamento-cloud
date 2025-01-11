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
    const {rows, columns} = response.data.data;
    return callback && callback(null, rows.map(row => {
      const cell_values = {};
      columns.forEach(column => {
        cell_values[column.name] = row[column.npi];
      });
      return {...cell_values, ...row}
    }));
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
  requestContext.set(cacheKey, response);
  return response;
};

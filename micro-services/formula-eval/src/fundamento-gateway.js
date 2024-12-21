import deasync from "deasync";
import {requestContext} from '@fastify/request-context';
import axios from "axios";

async function fetchFromFundamento(url, callback) {
  console.log(`fetching from fundamento ${url}...`)
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return callback && callback(null, response.data.rows.map(row => {
      const cell_values = {};
      response.data.columns.forEach(column => {
        cell_values[column.name] = row[column.npi];
      });
      return {...cell_values, ...row}
    }));
  } catch (e) {
    return callback && callback(e, null);
  }
}

const fundamentoBaseUrl = process.env.FUNDAMENTO_BASE_URL || "http://localhost:3000";

export const getTable = (tableId) => {
  const cacheKey = `tables/${tableId.toString()}`;
  const cachedResponse = requestContext.get(cacheKey);
  if (cachedResponse !== undefined) {
    return cachedResponse;
  }
  const response = deasync(fetchFromFundamento)(`${fundamentoBaseUrl}/tables_no_auth/tables/${tableId}`);
  requestContext.set(cacheKey, response);
  return response;
};

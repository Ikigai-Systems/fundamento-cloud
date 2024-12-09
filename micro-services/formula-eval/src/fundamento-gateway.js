import deasync from "deasync";

async function fetchFromFundamento(url, callback) {
  console.log(`fetching from fundamento ${url}...`)
  const response = await fetch(url, {
    method: "GET",
    headers: {
      'Accept': 'application/json',
    },
  });
  const responseJson = await response.json();
  return callback && callback(null, responseJson.data.rows);
}

const fundamentoBaseUrl = process.env.FUNDAMENTO_BASE_URL || "http://localhost:3000";

export const getTable = (tableId) => {
  return deasync(fetchFromFundamento)(`${fundamentoBaseUrl}/tables_no_auth/tables/${tableId}`);
};

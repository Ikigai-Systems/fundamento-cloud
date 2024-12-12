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
  return callback && callback(null, responseJson.data.rows.map(row => {
    const cell_values = {};
    responseJson.data.columns.forEach(column => {
      cell_values[column.name] = row[column.npi];
    });
    return {...cell_values, ...row}
  }));
}

const fundamentoBaseUrl = process.env.FUNDAMENTO_BASE_URL || "http://localhost:3000";

export const getTable = (tableId) => {
  return deasync(fetchFromFundamento)(`${fundamentoBaseUrl}/tables_no_auth/tables/${tableId}`);
};

import makeSynchronized from "make-synchronized";

export const {getTable} = makeSynchronized(import.meta, {
  getTable: async (tableId) => {
    const fundamentoBaseUrl = process.env.FUNDAMENTO_BASE_URL || "http://localhost:3000"
    const response = await fetch(`${fundamentoBaseUrl}/tables_no_auth/tables/${tableId}`, {
      method: "GET",
      headers: {
        'Accept': 'application/json',
      },
    });
    const responseJson = await response.json();
    return responseJson.data.rows;
  }
})

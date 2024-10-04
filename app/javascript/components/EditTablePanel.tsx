import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"

const EditTablePanel = ({table, data, space}: EditTablePanelProps) => {
  return <CurrentSpaceContext.Provider value={{space}}>
    <EditableTableWithRowstack table={table} data={data}/>
  </CurrentSpaceContext.Provider>
}

type EditTablePanelProps = {
  table: Table,
  space: Space,
  data: TableData
}

export default EditTablePanel;
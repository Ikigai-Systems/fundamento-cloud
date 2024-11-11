import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"
import {TableTitleInput} from "./EditTablePanel.tsx";

const ViewTablePanel = ({table, data, space}: ViewTablePanelProps) => {
  return <CurrentSpaceContext.Provider value={{space}}>
    <TableTitleInput table={table} space={space}/>

    <EditableTableWithRowstack table={table} data={data} isEditable={false}/>
  </CurrentSpaceContext.Provider>
}

type ViewTablePanelProps = {
  table: Table,
  space: Space,
  data: TableData
}

export default ViewTablePanel;
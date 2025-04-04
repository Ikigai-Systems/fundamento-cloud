import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"
import {ContentTitle} from "./ContentTitle.tsx";

const ViewTablePanel = ({table, data, space}: ViewTablePanelProps) => {
  window.tableData = {table, data};

  return <CurrentSpaceContext.Provider value={{space}}>
    <div className="content-editor-padding">
      <ContentTitle table={table}/>
    </div>

    <div className="content-editor-padding min-h-72">
      <EditableTableWithRowstack table={table} data={data} isEditable={false}/>
    </div>
  </CurrentSpaceContext.Provider>
}

type ViewTablePanelProps = {
  table: Table,
  space: Space,
  data: TableData
}

export default ViewTablePanel;
import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"
import {ContentTitle} from "./ContentTitle.tsx";

const ViewTablePanel = ({table, data, space}: ViewTablePanelProps) => {
  return <CurrentSpaceContext.Provider value={{space}}>
    <ContentTitle table={table}/>

    <div className="content-editor-padding">
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
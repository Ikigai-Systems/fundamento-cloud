import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"
import {TableTitleInput} from "./ContentTitle.tsx";

const EditTablePanel = ({table, data, space}: EditTablePanelProps) => {
  return <CurrentSpaceContext.Provider value={{space}}>

    <div className="flex flex-col">
      <div className="content-editor-padding">
        <TableTitleInput table={table} space={space}/>
      </div>

      <div className="content-editor-padding">
        <EditableTableWithRowstack table={table} data={data}/>
      </div>
    </div>
  </CurrentSpaceContext.Provider>
}

type EditTablePanelProps = {
  table: Table,
  space: Space,
  data: TableData
}

export default EditTablePanel;
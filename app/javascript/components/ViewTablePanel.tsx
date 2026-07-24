import EditableTableWithRowstack, {TableData} from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {Space, Table} from "../types.ts"

declare global {
  interface Window {
    // Exposed for debugging / test access only; never read from TypeScript.
    tableData: unknown;
  }
}

const ViewTablePanel = ({table, data, space}: ViewTablePanelProps) => {
  window.tableData = {table, data};

  return <CurrentSpaceContext.Provider value={{space}}>
    <div className="content-editor-padding min-h-72">
      <EditableTableWithRowstack
        table={table}
        data={data}
        isEditable={false}
        forceRerenderUuid=""
        initialViewProps={{columns: {}}}
        onViewPropsChange={() => {}}/>
    </div>
  </CurrentSpaceContext.Provider>
}

type ViewTablePanelProps = {
  table: Table,
  space: Space,
  data: TableData
}

export default ViewTablePanel;
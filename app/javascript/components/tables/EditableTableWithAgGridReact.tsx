import {useContext, useState} from "react";
import createFlash from "../createFlash.ts"
import CurrentSpaceContext from "../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../api/Tables/TablesApi.js";
import {AgGridReact} from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

const EditableTableWithAgGridReact = ({table, data}: EditableTableWithAgGridReactProps) => {
  const {space} = useContext(CurrentSpaceContext);

  const columns = data.columns.map(({npi, name}) => ({
    headerName: name,
    field: npi,
    editable: true,
    filter: true,
  }));
  const [rows, setRows] = useState(data.rows);

  return (<div className="flex flex-col">
    <input
      key={table.id + "_name"}
      type="text"
      placeholder="Untitled"
      defaultValue={table.name}
      className="-my-2 p-0 h-12 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-2xl font-bold text-slate-800"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
        } else if (e.key === "Escape") {
          if (e.target instanceof HTMLInputElement) {
            e.target.value = table.name;
            e.target.blur();
          }
        }
      }}
      onBlur={async (e) => {
        const newName = e.target.value;
        if (newName !== table.name) {
          try {
            await TablesApi.update({params: {space_npi: space.npi, id: table.id}, data: {name: e.target.value}});
          } catch (e) {
            createFlash({
              key: "table_update_failed",
              type: "error",
              message: "Failed to update the table, please reload page and try again."
            })
          }
        }
      }}
    >
    </input>
    <div
      className="ag-theme-quartz" // applying the Data Grid theme
      style={{ height: 500 }} // the Data Grid will fill the size of the parent container
    >
      <AgGridReact
        columnDefs={columns}
        rowData={rows}
        onCellValueChanged={async (event) => {
          try {
            await TablesApi.updateByReactDataGrid({
              params: {space_npi: space.npi, id: table.id},
              data: {
                rowId: event.data.npi,
                colId: event.column.colId,
                value: event.newValue,
              }
            });
          } catch (e) {
            //todo: Sentry.capture(e)
            createFlash({
              key: "table_update_failed",
              type: "error",
              message: "Failed to update the table, please reload page and try again."
            })
          }
        }}
      />
    </div>
  </div>);
};

type Row = {
  id: string,
  [key: string]: string,
}

type Column = {
  id: string,
  name: string,
}

export type TableData = {
  rows: Array<Row>,
  columns: Array<Column>,
}

type EditableTableWithAgGridReactProps = {
  // isEditable: boolean,
  table: Table,
  data: TableData,
  // initialViewProps: object,
  // onViewPropsChange: (any) => void,
}

export default EditableTableWithAgGridReact;

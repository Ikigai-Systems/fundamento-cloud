import {useCallback, useContext, useMemo, useRef} from "react";
import createFlash from "../createFlash.ts"
import CurrentSpaceContext from "../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../api/Tables/TablesApi.js";
import {DataEditor, GridCellKind} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css"

const EditableTableWithGlideDataGrid = ({table, data}: EditableTableWithGlideDataGridProps) => {
  const {space} = useContext(CurrentSpaceContext);

  const rowsRef = useRef(data.rows);

  const columns: GridColumn[] = useMemo<readonly GridColumn[]>(
    () => data.columns.map(({npi, name}) => ({id: npi, title: name}))
    , [data.columns]
  );

  const getCellContent = useCallback((cell: Item): GridCell => {
    const [col, row] = cell;
    const dataRow = rowsRef.current[row];
    // dumb but simple way to do this
    const indexes: (keyof DummyItem)[] = columns.map(({id}) => id);
    const d = dataRow[indexes[col]] + "";
    return {
      kind: GridCellKind.Text,
      allowOverlay: true,
      readonly: false,
      displayData: d,
      data: d,
    };
  }, []);

  const onCellEdited = useCallback(async (cell: Item, newValue: EditableGridCell) => {
    if (newValue.kind !== GridCellKind.Text) {
      // we only have text cells, might as well just die here.
      return;
    }

    const indexes: (keyof DummyItem)[] = columns.map(({id}) => id);
    const [col, row] = cell;
    const colId = indexes[col];
    const rowId = rowsRef.current[row].npi;

    rowsRef.current[row][colId] = newValue.data;

    // console.log(cell, newValue, colId, rowId);

    try {
      await TablesApi.updateByGlideDataGrid({
        params: {space_npi: space.npi, id: table.id},
        data: {cell, newValue, colId, rowId}
      });
    } catch (e) {
      //todo: Sentry.capture(e)
      createFlash({
        key: "table_update_failed",
        type: "error",
        message: "Failed to update the table, please reload page and try again."
      })
    } finally {
    }

    // const indexes: (keyof DummyItem)[] = columns.map(({id}) => id);
    // const [col, row] = cell;
    // const key = indexes[col];
    // data[row][key] = newValue.data;
  }, []);

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
    <DataEditor
      columns={columns}
      rows={rowsRef.current.length}
      getCellContent={getCellContent}
      onCellEdited={onCellEdited}
      smoothScrollX={true}
      smoothScrollY={true}
    />
    <div id="portal" style={{position: "fixed", left: 0, top: 0, zIndex: 9999}}/>
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

type EditableTableWithGlideDataGridProps = {
  // isEditable: boolean,
  table: Table,
  data: TableData,
  // initialViewProps: object,
  // onViewPropsChange: (any) => void,
}

export default EditableTableWithGlideDataGrid;

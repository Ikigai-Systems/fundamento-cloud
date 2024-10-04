import Rowstack from "rowstack";
import {useContext} from "react";
import createFlash from "../createFlash.ts"
import CurrentSpaceContext from "../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../api/Tables/TablesApi.js";
import {Config} from "@js-from-routes/client";
import {Table} from "../../types.ts";

const toType = (kind: "string" | "integer" | "long_text") => {
  switch (kind) {
  case "integer":
    return "number";
  case "long_text":
    return "longText";
  default:
    return "text";
  }
}

const EditableTableWithRowstack = ({table, data}: EditableTableWithRowstackProps) => {
  const {space} = useContext(CurrentSpaceContext);

  const columns = data.columns.map(({npi, name, kind}) => ({id: npi, name, type: toType(kind)}));
  const rows = data.rows.map(({npi, ...row}) => ({...row, id: npi}));

  return (<div className="flex flex-col">
    <input key={table.id + "_name"} type="text"
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

    <Rowstack
      columns={columns}
      data={rows}
      config={{}}
      onChange={async (event) => {
        if ((event.type === "update_column" && Object.keys(event.update).length === 1 && event.update.width !== undefined)
          || (event.type === "update_row" && Object.keys(event.update).length === 1 && event.update.isSelected !== undefined)
        ) {
          return; // skip frontend-session related changes from being passed to the backend
        }
        const currentDataSerializer = Config.serializeData;
        try {
          Config.serializeData = (val => val);
          await TablesApi.updateByRowstack({
            params: {space_npi: space.npi, id: table.id},
            data: {event}
          });
        } catch (e) {
          //todo: Sentry.capture(e)
          createFlash({
            key: "table_update_failed",
            type: "error",
            message: "Failed to update the table, please reload page and try again."
          })
        } finally {
          Config.serializeData = currentDataSerializer;
        }
      }}
    />
  </div>);
};

type Row = {
  id: string,
  [key: string]:string,
}

type Column = {
  id: string,
  name: string,
}

export type TableData = {
  rows: Array<Row>,
  columns: Array<Column>,
}

type EditableTableWithRowstackProps = {
  table: Table,
  data: TableData
}

export default EditableTableWithRowstack;

import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"
import TablesApi from "../api/Tables/TablesApi";
import createFlash from "./createFlash.ts";

type TableTitleInputProps = {
  table: Table,
  space: Space,
}

export const TableTitleInput = ({table, space}: TableTitleInputProps) => {
  return <input
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
          const errorMessage = (e.response?.data?.errors)
            ? Object.entries(e.response.data.errors).map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)} ${value}`).join("<br/>")
            : "Failed to update the table, please reload page and try again.";
          createFlash({
            type: "error",
            message: errorMessage,
          })
        }
      }
    }}
  >
  </input>;
}

const EditTablePanel = ({table, data, space}: EditTablePanelProps) => {
  return <CurrentSpaceContext.Provider value={{space}}>

    <div className="flex flex-col">
      <TableTitleInput table={table} space={space}/>

      <EditableTableWithRowstack table={table} data={data}/>
    </div>
  </CurrentSpaceContext.Provider>
}

type EditTablePanelProps = {
  table: Table,
  space: Space,
  data: TableData
}

export default EditTablePanel;
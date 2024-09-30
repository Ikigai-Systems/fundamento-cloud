import {Space, Table} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from ".././contextes/CurrentSpaceContext";
import TablesApi from "../api/Tables/TablesApi.js";
import queryClient from ".././contextes/ReactQueryClient.tsx";
import Rowstack from "rowstack";
import createFlash from "./createFlash.ts";
import {Config} from '@js-from-routes/client'

const EditTablePanel = ({table, space, data}: EditTablePanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <input key={table.id + "_name"} type="text"
        placeholder="Untitled"
        defaultValue={table.name}
        className="pl-[3.4rem] h-12 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-4xl text-slate-800"
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
          if (newName !== document.title) {
            // const updatedDocument = await DocumentsApi.update({params: document, data: {title: e.target.value}});
            // const sideBarElement = window.document.querySelector(`[data-document-id="${updatedDocument.id}"]`);
            // if (sideBarElement) {
            //   sideBarElement.innerHTML = updatedDocument.title;
            // }
            // document = updatedDocument; //todo: ensure this work in React world
          }
        }}
      >
      </input>

      <div className="editor-container">
        <Rowstack
          columns={data.columns.map(({npi, name, kind}) => ({id: npi, name, type: kind === "integer" ? "number" : "text"}))}
          data={data.rows.map(({npi, ...row}) => ({...row, id: npi}))}
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
              createFlash({key: "table_update_failed", type: "error", message: "Failed to update the table, please reload page and try again."})
            } finally {
              Config.serializeData = currentDataSerializer;
            }
          }}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

type Row = {
  id: string,
  [key: string]:string,
}

type Column = {
  id: string,
  name: string,
}

type Data = {
  rows: Array<Row>,
  columns: Array<Column>,
}

type EditTablePanelProps = {
  table: Table,
  space: Space,
  data: Data
}

export default EditTablePanel;
import {Table, Space, User} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from ".././contextes/CurrentSpaceContext";
import queryClient from ".././contextes/ReactQueryClient.tsx";
import Rowstack from "rowstack";

type EditTablePanelProps = {
  table: Table,
  space: Space,
}

const EditTablePanel = ({table, space}: EditTablePanelProps) => {
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
          columns={Object.keys(table.data[0]).map((key) => ({id: key, name: key}))} config={{}}
          data={table.data}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditTablePanel;
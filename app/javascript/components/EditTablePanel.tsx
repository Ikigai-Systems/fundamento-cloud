import EditableTableWithRowstack from "./tables/EditableTableWithRowstack.tsx";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext.tsx";
import {TableData} from "tables/EditableTableWithRowstack.tsx"
import {Space, Table} from "../types.ts"
import {TableTitleInput} from "./ContentTitle.tsx";
import {useQuery} from "@tanstack/react-query";
import {Config} from "@js-from-routes/client";
import TablesApi from "../api/Tables/TablesApi.js";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {useRef} from "react";

const EditTablePanel = ({table, data, space}: EditTablePanelProps) => {
  const initialRender = useRef(true);

  const tableQuery = useQuery({queryKey: ["tables", space?.npi, table.id.toString()], queryFn: async () => {
    if (initialRender.current === true) {
      initialRender.current = false;
      return {table, data, forceReRenderUuid: crypto.randomUUID()}
    } else {
      const currentDataDeserializer = Config.deserializeData;
      Config.deserializeData = (val => val);
      const promiseData = TablesApi.show({space_npi: space?.npi, id: table.id});
      Config.deserializeData = currentDataDeserializer;
      const data = await promiseData
      return {...data, forceRerenderUuid: crypto.randomUUID()}
    }
  }}, queryClient);
  const {isLoading, isError} = tableQuery;

  return <CurrentSpaceContext.Provider value={{space}}>

    <div className="flex flex-col">
      <div className="content-editor-padding">
        <TableTitleInput table={table} space={space}/>
      </div>

      <div className="content-editor-padding">
        {!isLoading && !isError && <EditableTableWithRowstack table={tableQuery.data.table} data={tableQuery.data.data} forceRerenderUuid={tableQuery.data.forceRerenderUuid}/>}
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
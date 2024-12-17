import {createReactBlockSpec} from "@blocknote/react";
import {useContext, useEffect, useRef, useState} from "react";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";
import AsyncSelect from 'react-select/async';
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import {Config} from "@js-from-routes/client";
import EditableTableWithRowstack from "../../tables/EditableTableWithRowstack.tsx";
import {request} from "@js-from-routes/axios";
import deepmerge from "deepmerge";
import {ContentTitle, TableTitleInput} from "../../ContentTitle.tsx";

const sampleRows = [
  {
    id: "sample_row_1",
  },
  {
    id: "sample_row_2",
  },
  {
    id: "sample_row_3",
  },
];

const sampleColumns = [
  {
    id: "sample_column_name",
    name: "Name",
  },
  {
    id: "sample_column_2",
    name: "Column 2",
  },
  {
    id: "sample_column_3",
    name: "Column 3",
  },
  {
    id: "sample_column_4",
    name: "Notes",
    type: "longText",
  },
];

const ChartBlock = createReactBlockSpec(
  {
    type: "chartBlock",
    propSchema: {
      // textAlignment: defaultProps.textAlignment,
      // textColor: defaultProps.textColor,
      tableId: {
        default: -1
      },
      // viewProps: {
      //   default: JSON.stringify({columns: {}}),
      // }
    },
    content: "none",
    isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const blockProps = props.block.props;
      // const [viewProps, setViewProps] = useState(JSON.parse(blockProps.viewProps));
      const editor = props.editor;
      const {space} = useContext(CurrentSpaceContext);
      const tableId = blockProps.tableId;
      const inputFile = useRef<HTMLInputElement | undefined>(undefined);
      const [isCreating, setIsCreating] = useState(false);
      const tableQuery = useQuery({queryKey: ["tables", space?.npi, tableId.toString()], queryFn: async () => {
        if (tableId === -1) {
          return null;
        }
        const currentDataDeserializer = Config.deserializeData;
        Config.deserializeData = (val => val);
        const promiseData = TablesApi.show({space_npi: space?.npi, id: tableId});
        Config.deserializeData = currentDataDeserializer;
        const data = await promiseData;
        return {...data, forceRerenderUuid: crypto.randomUUID()}
      }}, queryClient);
      const {isLoading, isError} = tableQuery;

      if (isLoading || isCreating) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center">
            Loading table...
            <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
          </div>
        )
      }

      if (tableId === -1) {
        return (
          <div className="divide-y divide-gray-200 rounded-lg bg-white shadow border min-w-[40rem] mx-auto">
            <div className="px-4 py-4 sm:px-6 flex flex-row justify-between items-center">
              <div className="font-bold">New chart</div>
              <button
                className="flex flex-col items-center p-1 rounded-md transition-all hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                onClick={() => {
                  editor.removeBlocks([props.block]);
                }}
              >
                <div className="size-5 icon-[heroicons--x-mark]"></div>
              </button>
            </div>
            <div className="px-4 py-3 sm:p-6">
              <div className="font-bold text-sm py-3">Data source table</div>

              <div className="mb-48">
                <AsyncSelect
                  isDisabled={isCreating}
                  cacheOptions
                  defaultOptions
                  loadOptions={async (query) => {
                    const tables = await TablesApi.index({
                      params: {
                        space_npi: space?.npi,
                        query: {query}
                      }
                    });
                    return tables.map(table => ({value: table.id, label: table.name}));
                  }}
                  onChange={(newOption) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableId: (newOption as { value: any }).value,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>
        )
      }

      if (isError) {
        return (<>
          <div className="divide-y divide-gray-200 rounded-lg bg-white shadow border min-w-[40rem] mx-auto">
            <div className="px-4 py-4 sm:px-6 flex flex-row justify-between items-center">
              <div className="text-red-800 flex items-center justify-center font-bold">
                Unable to load table with id {tableId}
              </div>
              <button
                className="flex flex-col items-center p-1 rounded-md transition-all hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                onClick={() => {
                  editor.removeBlocks([props.block]);
                }}
              >
                <div className="size-5 icon-[heroicons--x-mark]"></div>
              </button>
            </div>
            <div className="px-4 py-3 sm:p-6">
              <div className="font-bold text-sm py-3">Data source table</div>

              <div className="mb-48">
                <AsyncSelect
                  isDisabled={isCreating}
                  cacheOptions
                  defaultOptions
                  loadOptions={async (query) => {
                    const tables = await TablesApi.index({
                      params: {
                        space_npi: space?.npi,
                        query: {query}
                      }
                    });
                    return tables.map(table => ({value: table.id, label: table.name}));
                  }}
                  onChange={(newOption) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableId: (newOption as { value: any }).value,
                      },
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </>)
      }

      return (<div className="flex flex-col w-full">
        <div className="flex flex-row items-center">
          {space && editor.isEditable && <TableTitleInput table={tableQuery.data.table} space={space}
                                                          extraClasses="text-xl font-bold min-h-0 max-h-6 mt-0 p-0"/>}
          {!editor.isEditable &&
            <ContentTitle table={tableQuery.data.table} extraClasses="text-xl font-bold min-h-0 max-h-6 p-0"/>}
        </div>
      </div>);
    },
  }
);

export default ChartBlock;
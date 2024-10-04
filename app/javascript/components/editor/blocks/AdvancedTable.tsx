import {defaultProps} from "@blocknote/core";
import {createReactBlockSpec} from "@blocknote/react";
import {useContext, useState} from "react";
import createFlash from "../../createFlash.ts"
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";
import AsyncSelect from 'react-select/async';
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import {Config} from "@js-from-routes/client";
import EditableTableWithRowstack from "../../tables/EditableTableWithRowstack.tsx";

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

const AdvancedTable = createReactBlockSpec(
  {
    type: "advancedTable",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      tableId: {
        default: -1
      }
    },
    content: "none",
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const blockProps = props.block.props;
      const editor = props.editor;
      const {space} = useContext(CurrentSpaceContext);
      const tableId = blockProps.tableId;
      const [isCreateBlankLoading, setCreateBlankLoading] = useState(false);
      const tableQuery = useQuery({queryKey: ["tables", space.npi, tableId], queryFn: async () => {
        if (tableId === -1) {
          return null;
        }
        const currentDataDeserializer = Config.deserializeData;
        try {
          Config.deserializeData = (val => val);
          return (await TablesApi.show({space_npi: space.npi, id: tableId}));
        } finally {
          Config.deserializeData = currentDataDeserializer;
        }
      }}, queryClient);
      const {isLoading, isError} = tableQuery;

      if (isLoading) {
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
              <div className="font-bold">New table</div>
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
              <div className="flex flex-row gap-6 justify-center">
                <button
                  className="secondary-button"
                  disabled={isCreateBlankLoading}
                  onClick={async () => {
                    setCreateBlankLoading(true);
                    try {
                      const table = await TablesApi.create({
                        params: {
                          space_npi: space.npi
                        },
                        data: {
                          table: {
                            rows: sampleRows,
                            columns: sampleColumns,
                          }
                        }
                      });
                      editor.updateBlock(props.block, {
                        props: {
                          tableId: table.id,
                        },
                      });
                    } finally {
                      setCreateBlankLoading(false);
                    }
                  }}
                >
                  <div className="-ml-1 mr-1 size-5 icon-[heroicons--plus-circle-solid]"></div>
                  Start blank
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    createFlash({
                      type: "info",
                      message: `Not implemented<br/><br/>
This will open modal dialog allowing user to select csv file from local computer.
User either finishes journey by successfully uploading a file or cancels the table creation process.`,
                    });
                    editor.removeBlocks([props.block]);
                  }}
                >
                  <div className="-ml-1 mr-1 size-5 icon-[heroicons--arrow-down-on-square]"></div>
                  Import data
                </button>
              </div>
              <div className="font-bold text-sm py-3">Or use existing table</div>

              <div className="mb-48">
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={async (query) => {
                    const tables = await TablesApi.index({
                      params: {
                        space_npi: space.npi,
                        query: {query}
                      }
                    });
                    return tables.map(table => ({value: table.id, label: table.name}));
                  }}
                  onChange={(newOption) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableId: newOption.value,
                      },
                    });
                  }}
                />
              </div>
            </div>
            {/*<div className="px-4 py-3 sm:px-6">*/}
            {/*  FOOTER*/}
            {/*</div>*/}
          </div>
        )
      }

      if (isError) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center text-red-800">Unable to load table with id {tableId}</div>
        )
      }

      return (<div className="flex flex-col w-full">
        <EditableTableWithRowstack table={tableQuery.data.table} data={tableQuery.data.data}/>
      </div>);
    },
  }
);

export default AdvancedTable;
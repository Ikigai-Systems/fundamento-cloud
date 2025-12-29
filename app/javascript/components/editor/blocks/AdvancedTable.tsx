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

const SelectOrCreateTableContainer = ({space, editor, block}) => {
  const inputFile = useRef<HTMLInputElement | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-600 rounded-lg bg-white dark:!bg-gray-800 text-slate-800 dark:text-white shadow border dark:border-gray-600 min-w-[40rem] mx-auto">
      <div className="px-4 py-4 sm:px-6 flex flex-row justify-between items-center">
        <div className="font-bold">New table</div>
        <button
          className="flex flex-col items-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 active:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          onClick={() => {
            editor.removeBlocks([block]);
          }}
        >
          <div className="size-5 icon-[heroicons--x-mark]"></div>
        </button>
      </div>
      <div className="px-4 py-3 sm:p-6">
        <div className="flex flex-row gap-6 justify-center">
          <button
            className="secondary-button"
            disabled={isCreating || !editor.isEditable}
            onClick={async () => {
              setIsCreating(true);
              try {
                const table = await TablesApi.create({
                  params: {
                    query: {
                      space_npi: space?.npi,
                    },
                  },
                  data: {
                    table: {
                      rows: sampleRows,
                      columns: sampleColumns,
                    }
                  }
                });
                editor.updateBlock(block, {
                  props: {
                    tableNpi: table.npi,
                  },
                });
              } finally {
                setIsCreating(false);
              }
            }}
          >
            <div className="-ml-1 mr-1 size-5 icon-[heroicons--plus-circle-solid]"></div>
            Start blank
          </button>
          <input type="file" accept="text/csv" className="hidden" ref={inputFile} onChange={async (e) => {
            setIsCreating(true);
            try {
              const file = e.target?.files?.[0];
              const body = new FormData();
              body.append('table[csv_file]', file);

              const table = await request("post", TablesApi.create.path(), {
                params: {
                  query: {
                    space_npi: space?.npi
                  }
                },
                data: body,
                responseAs: "json",
                headers: {
                  'Content-Type': 'multipart/form-data',
                }
              });

              editor.updateBlock(block, {
                props: {
                  tableNpi: table.npi,
                },
              });
            } finally {
              setIsCreating(false);
            }
          }}/>
          <button
            className="secondary-button"
            disabled={isCreating || !editor.isEditable}
            onClick={(e) => {
              e.preventDefault();
              inputFile?.current?.click();
            }}
          >
            <div className="-ml-1 mr-1 size-5 icon-[heroicons--arrow-down-on-square]"></div>
            Import data
          </button>
        </div>
        <div className="font-bold text-sm py-3">Or use existing table</div>

        <div className="mb-48">
          <AsyncSelect
            className="fundamento-react-select-container"
            classNamePrefix="fundamento-react-select"
            isDisabled={isCreating || !editor.isEditable}
            cacheOptions
            defaultOptions
            loadOptions={async (query) => {
              const tables = await TablesApi.index({
                query: {
                  space_npi: space.npi,
                  query,
                }
              });
              return tables.map(table => ({value: table.npi, label: table.name}));
            }}
            onChange={(newOption) => {
              editor.updateBlock(block, {
                props: {
                  tableNpi: (newOption as { value: any }).value,
                },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const createAdvancedTable = createReactBlockSpec(
  {
    type: "advancedTable",
    propSchema: {
      // 2025-01-02 tableId is deprecated, remove it after Pawel implements blocknote to yjs converter and plays with backend migration
      tableId: {
        default: -1
      },
      tableNpi: {
        default: "",
      },
      viewProps: {
        default: JSON.stringify({columns: {}}),
      }
    },
    content: "none",
    isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const blockProps = props.block.props;
      const [viewProps, setViewProps] = useState(JSON.parse(blockProps.viewProps));
      const initialRender = useRef(true);

      useEffect(() => {
        if (initialRender.current === true) {
          initialRender.current = false;
        } else {
          editor.updateBlock(props.block, {
            props: {
              viewProps: JSON.stringify(viewProps),
            },
          });
        }
      }, [viewProps])

      const editor = props.editor;
      const {space} = useContext(CurrentSpaceContext);
      const tableNpi = blockProps.tableNpi;
      const tableQuery = useQuery({
        queryKey: ["tables", space.npi, tableNpi], queryFn: async () => {
          if (tableNpi === "") {
            return null;
          }
          const currentDataDeserializer = Config.deserializeData;
          Config.deserializeData = (val => val);
          const promiseData = TablesApi.show({npi: tableNpi});
          Config.deserializeData = currentDataDeserializer;
          const data = await promiseData;
          return {...data, forceRerenderUuid: crypto.randomUUID()}
        }
      }, queryClient);
      const {isLoading, isError} = tableQuery;

      if (isLoading) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center text-slate-400 dark:text-gray-500">
            Loading table...
            <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
          </div>
        )
      }

      if (tableNpi === "") {
        return (<SelectOrCreateTableContainer editor={editor} space={space} block={props.block}/>);
      }

      if (isError) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center text-red-800 dark:text-red-400">
            Unable to load table with id {tableNpi}
          </div>
        )
      }

      return (<div className="flex flex-col w-full">
        <div className="flex flex-row items-center">
          {space && editor.isEditable && <TableTitleInput table={tableQuery.data.table} space={space}
            extraClasses="text-xl font-bold min-h-0 max-h-6 mt-0 p-0"/>}
          {!editor.isEditable &&
                <ContentTitle table={tableQuery.data.table} extraClasses="text-xl font-bold min-h-0 max-h-6 p-0"/>}
        </div>

        <div className="min-h-72">
          <EditableTableWithRowstack
            isEditable={editor.isEditable}
            table={tableQuery.data.table}
            data={tableQuery.data.data}
            forceRerenderUuid={tableQuery.data.forceRerenderUuid}
            initialViewProps={JSON.parse(blockProps.viewProps)}
            onViewPropsChange={(event) => {
              setViewProps((prevViewProps) => {
                return deepmerge(prevViewProps, event);
              })
            }}
          />
        </div>

      </div>);
    },
  }
);
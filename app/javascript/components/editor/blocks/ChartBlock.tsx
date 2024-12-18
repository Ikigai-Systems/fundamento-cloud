import {createReactBlockSpec} from "@blocknote/react";
import React, {useContext} from "react";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";
import AsyncSelect from 'react-select/async';
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import {Config} from "@js-from-routes/client";
import Chart from 'react-apexcharts'
import {BlockTitle} from "../BlockTitle.tsx";
import SelectButton from "../../SelectButton.tsx";

const CHART_TYPES = ["line", "area", "bar", "pie", "donut", "radialBar", "scatter", "bubble", "heatmap", "candlestick", "boxPlot", "radar", "polarArea", "rangeBar", "rangeArea", "treemap"];


const ChartBlock = createReactBlockSpec(
  {
    type: "chartBlock",
    propSchema: {
      tableId: {
        default: "",
      },
      title: {
        default: "",
      },
      chartType: {
        default: "line",
        values: CHART_TYPES,
      },
      xAxisColumnNpi: {
        default: "",
      },
      yAxisColumnNpi: {
        default: "",
      }
    },
    content: "none",
    isSelectable: false,
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const blockProps = props.block.props;
      const editor = props.editor;
      const {space} = useContext(CurrentSpaceContext);
      const {tableId, title, chartType, xAxisColumnNpi, yAxisColumnNpi} = blockProps;
      const tableQuery = useQuery({queryKey: ["tables", space?.npi, tableId.toString()], queryFn: async () => {
        if (tableId === "") {
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

      if (isLoading) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center">
            Loading data source table...
            <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
          </div>
        )
      }

      if (tableId === "") {
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
                  onChange={(newOption : {value: string, label : string}) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableId: newOption.value,
                        title: `Chart for ${newOption.label}`,
                        chartType: "line",
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
            {editor.isEditable && <div className="px-4 py-3 sm:p-6">
              <div className="font-bold text-sm py-3">Data source table</div>

              <div className="mb-48">
                <AsyncSelect
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
                  onChange={(newOption : {value: string, label : string}) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableId: newOption.value,
                      },
                    });
                  }}
                />
              </div>
            </div>}
          </div>
        </>)
      }

      const {columns, rows} = tableQuery.data.data;

      return (<div className="flex flex-col w-full">
        <BlockTitle isEditable={editor.isEditable} placeholder="Untitled chart" defaultValue={title} onChange={(value) => {
          editor.updateBlock(props.block, {
            props: {
              title: value,
            },
          });
        }}/>

        <div className="flex flex-row items-center w-full gap-8 h-8 my-3">
          <div className="flex flex-row items-center">
            <label className="text-sm mx-2">Chart type</label>
            {editor.isEditable && <SelectButton value={chartType} options={CHART_TYPES} onChange={(value) => {
              editor.updateBlock(props.block, {
                props: {
                  chartType: value,
                },
              });
            }}/>}
            {!editor.isEditable && <div className="border h-8 w-32 px-2 flex flex-row items-center justify-between rounded-lg text-sm">
              {chartType}
            </div>}
          </div>
          <div className="flex flex-row items-center">
            <label className="text-sm mx-2">X axis</label>
            {editor.isEditable && <SelectButton
              value={xAxisColumnNpi}
              options={columns.map(column => ({value: column.npi, label: column.name}))}
              onChange={(option) => {
                editor.updateBlock(props.block, {
                  props: {
                    xAxisColumnNpi: option?.value,
                  },
                });
              }}
            />}
            {!editor.isEditable && <div className="border h-8 w-32 px-2 flex flex-row items-center justify-between rounded-lg text-sm">
              {columns.find(column => column.npi === xAxisColumnNpi)?.name || "None"}
            </div>}
          </div>
          <div className="flex flex-row items-center">
            <label className="text-sm mx-2">Y axis</label>
            {editor.isEditable && <SelectButton
              value={yAxisColumnNpi}
              options={columns.map(column => ({value: column.npi, label: column.name}))}
              onChange={(option) => {
                editor.updateBlock(props.block, {
                  props: {
                    yAxisColumnNpi: option?.value,
                  },
                });
              }}
            />}
            {!editor.isEditable && <div className="border h-8 w-32 px-2 flex flex-row items-center justify-between rounded-lg text-sm">
              {columns.find(column => column.npi === yAxisColumnNpi)?.name || "None"}
            </div>}
          </div>
        </div>

        {xAxisColumnNpi !== "" && yAxisColumnNpi !== "" &&
          <Chart
            options={{
              chart: {
                id: `${props.block.id}-chart`,
                width: '100%',
              },
              xaxis: {
                categories: rows.map(row => {
                  const cellValue = row[xAxisColumnNpi];
                  if (cellValue === null) {
                    return ""
                  } else {
                    return cellValue;
                  }
                }),
              }
            }}
            series={[{
              name: 'series-1',
              data: rows.map(row => row[yAxisColumnNpi]),
            }]}
            type={chartType}
          />
        }
      </div>);
    },
  }
);

export default ChartBlock;
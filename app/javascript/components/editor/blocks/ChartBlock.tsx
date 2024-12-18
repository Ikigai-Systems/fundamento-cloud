import {createReactBlockSpec} from "@blocknote/react";
import React, {useContext, useEffect, useRef, useState} from "react";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";
import AsyncSelect from 'react-select/async';
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import {Config} from "@js-from-routes/client";
import Chart from 'react-apexcharts'
import {ContentTitle, TableTitleInput} from "../../ContentTitle.tsx";
import {BlockTitle} from "../BlockTitle.tsx";
import SelectButton from "../../SelectButton.tsx";

const CHART_TYPES = ["line", "area", "bar", "pie", "donut", "radialBar", "scatter", "bubble", "heatmap", "candlestick", "boxPlot", "radar", "polarArea", "rangeBar", "rangeArea", "treemap"];


const ChartBlock = createReactBlockSpec(
  {
    type: "chartBlock",
    propSchema: {
      tableId: {
        default: ""
      },
      title: {
        default: ""
      },
      chartType: {
        default: "line",
        values: CHART_TYPES,
      },
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
      const {tableId, title, chartType} = blockProps;
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
            Loading table...
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
                  onChange={(newOption : {value: string, label : string}) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableId: newOption.value,
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
        <BlockTitle isEditable={editor.isEditable} placeholder="Untitled chart" defaultValue={title} onChange={(value) => {
          editor.updateBlock(props.block, {
            props: {
              title: value,
            },
          });
        }}/>

        <div className="flex flex-row items-center w-full gap-2 h-8 my-3">
          <label className="text-sm">Chart type</label>
          <SelectButton value={chartType} options={CHART_TYPES} onChange={(value) => {
            editor.updateBlock(props.block, {
              props: {
                chartType: value,
              },
            });
          }}>
            Chart type
          </SelectButton>
          <div>x axis</div>
          <div>y axis</div>
        </div>

        <div className="flex flex-row items-center">
          <Chart
            options={{
              chart: {
                id: 'apexchart-example'
              },
              xaxis: {
                categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]
              }
            }}
            series={[{
              name: 'series-1',
              data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
            }]}
            type={chartType}
            width={500}
            height={320}
          />
        </div>
      </div>);
    },
  }
);

export default ChartBlock;
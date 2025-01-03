import {createReactBlockSpec} from "@blocknote/react";
import React, {useContext, useState} from "react";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";
import AsyncSelect from 'react-select/async';
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import {Config} from "@js-from-routes/client";
import ReactApexChart from 'react-apexcharts'
import {BlockTitle} from "../BlockTitle.tsx";
import SelectButton from "../../SelectButton.tsx";
import FormulasApi from "../../../api/FormulasApi";
import handleFormulaResultCommands from "../../formulas/handleFormulaResultCommands.ts";
import useAsyncEffect from "use-async-effect";

const CHART_TYPES = ["line", "area", "bar", "funnel", "pie", "donut", "radialBar", "scatter", "heatmap", "radar", "polarArea", "treemap"];


const ChartBlock = createReactBlockSpec(
  {
    type: "chartBlock",
    propSchema: {
      tableNpi: {
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
      const {tableNpi, title, chartType, xAxisColumnNpi, yAxisColumnNpi} = blockProps;
      const [xAxisDataset, setXAxisDataset] = useState<any>(undefined);
      const [yAxisDataset, setYAxisDataset] = useState<any>(undefined);
      const tableQuery = useQuery({queryKey: ["tables", space?.npi, tableNpi], queryFn: async () => {
        if (tableNpi === "") {
          return null;
        }
        const currentDataDeserializer = Config.deserializeData;
        Config.deserializeData = (val => val);
        const promiseData = TablesApi.show({npi: tableNpi});
        Config.deserializeData = currentDataDeserializer;
        const data = await promiseData;
        return {...data, forceRerenderUuid: crypto.randomUUID()}
      }}, queryClient);
      const {isLoading, isError} = tableQuery;

      const useFormula = false;

      useAsyncEffect(async () => {
        if (useFormula) {
          const formulaResult = await FormulasApi.eval({data: {formula: `ForEach(Table(${tableNpi}), Dig(CurrentValue, "${xAxisColumnNpi}"))`}});
          handleFormulaResultCommands(formulaResult, space);
          setXAxisDataset(formulaResult.result);
        } else {
          const xAxisColumnValues = tableQuery?.data?.data?.rows.map((row: Array<any>) => row[xAxisColumnNpi]);
          setXAxisDataset(xAxisColumnValues);
        }
      }, [xAxisColumnNpi, tableQuery.data]);

      useAsyncEffect(async () => {
        if (useFormula) {
          const formulaResult = await FormulasApi.eval({data: {formula: `ForEach(Table(${tableNpi}), Dig(CurrentValue, "${yAxisColumnNpi}"))`}});
          handleFormulaResultCommands(formulaResult, space);
          setYAxisDataset(formulaResult.result);
        } else {
          const yAxisColumnValues = tableQuery?.data?.data?.rows.map((row: Array<any>) => row[yAxisColumnNpi]);
          setYAxisDataset(yAxisColumnValues);
        }
      }, [yAxisColumnNpi, tableQuery.data]);

      if (isLoading) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center">
            Loading data source table...
            <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
          </div>
        )
      }

      if (tableNpi === "") {
        return (
          <div className="divide-y divide-gray-200 rounded-lg bg-white shadow border min-w-[40rem] mx-auto">
            <div className="px-4 py-4 sm:px-6 flex flex-row justify-between items-center">
              <div className="font-bold">New chart</div>
              {editor.isEditable && <button
                className="flex flex-col items-center p-1 rounded-md transition-all hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                onClick={() => {
                  editor.removeBlocks([props.block]);
                }}
              >
                <div className="size-5 icon-[heroicons--x-mark]"></div>
              </button>}
            </div>
            <div className="px-4 py-3 sm:p-6">
              <div className="font-bold text-sm py-3">Data source table</div>

              <div className="mb-48">
                <AsyncSelect
                  isDisabled={!editor.isEditable}
                  cacheOptions
                  defaultOptions
                  loadOptions={async (query) => {
                    const tables = await TablesApi.index({
                      query: {
                        space_npi: space?.npi,
                        query,
                      }
                    });
                    return tables.map(table => ({value: table.npi, label: table.name}));
                  }}
                  onChange={(newOption : {value: string, label : string}) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableNpi: newOption.value,
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
                Unable to load table with id {tableNpi}
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
                    return tables.map(table => ({value: table.npi, label: table.name}));
                  }}
                  onChange={(newOption : {value: string, label : string}) => {
                    editor.updateBlock(props.block, {
                      props: {
                        tableNpi: newOption.value,
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

      const valueToSeriesPoint = (invalidValue = null) => (value) => {
        if (value !== null && value !== '') {
          const number = Number(value);
          if (isNaN(number)) {
            return invalidValue;
          } else {
            return number;
          }
        } else {
          return invalidValue;
        }
      }

      let chart: any = undefined;
      if (chartType !== "" && xAxisDataset !== undefined && yAxisDataset !== undefined) {
        switch (chartType) {
          case "line":
          case "area":
          case "bar":
          case "radar":
            chart = {};
            chart.type = chartType;
            chart.options = {
              chart: {
                type: chartType
              },
              xaxis: {
                categories: xAxisDataset.map((data: any) => data === null ? "" : data),
              }
            };
            chart.series = [{
              name: columns.find(column => column.npi === yAxisColumnNpi)?.name,
              data: yAxisDataset.map(valueToSeriesPoint())
            }];
            break;
          case "funnel":
            chart = {};
            chart.type = "bar";
            chart.options = {
              chart: {
                dropShadow: {
                  enabled: true,
                },
              },
              plotOptions: {
                bar: {
                  borderRadius: 0,
                  horizontal: true,
                  barHeight: '80%',
                  isFunnel: true,
                },
              },
              dataLabels: {
                enabled: true,
                formatter: function (val, opt) {
                  return opt.w.globals.labels[opt.dataPointIndex] + ':  ' + val
                },
                dropShadow: {
                  enabled: true,
                },
              },
              xaxis: {
                categories: xAxisDataset.map((data: any) => data === null ? "" : data),
              },
              legend: {
                show: false,
              },
            };
            chart.series = [{
              name: columns.find(column => column.npi === yAxisColumnNpi).name,
              data: yAxisDataset.map(valueToSeriesPoint())
            }];
            break;
          case "pie":
          case "donut":
          case "radialBar":
          case "polarArea":
            chart = {};
            chart.type = chartType;
            chart.series = yAxisDataset.map(valueToSeriesPoint(chartType === "polarArea" ? "" : null));
            chart.options = {
              chart: {
                type: chartType,
              },
              labels: xAxisDataset.map((data: any) => data === null ? "" : data),
            };
            break;
          case "scatter":
          case "heatmap":
            chart = {};
            chart.type = chartType;
            chart.options = {
              chart: {
                type: chartType,
              },
              xaxis: {
                labels: {
                  formatter: function(val) {
                    return parseFloat(val).toFixed(1)
                  }
                }
              },
              yaxis: {
                labels: {
                  formatter: function(val) {
                    return parseFloat(val).toFixed(1)
                  }
                }
              },
            };
            chart.series = [{
              name: columns.find(column => column.npi === xAxisColumnNpi)?.name,
              data: yAxisDataset.map((yValue, index) => {
                return [valueToSeriesPoint()(yValue), valueToSeriesPoint()(xAxisDataset[index])];
              }),
            }];
            break;
          case "treemap":
            chart = {};
            chart.type = chartType;
            chart.options = {
              chart: {
                type: chartType,
              }
            };
            chart.series = [{
              data: yAxisDataset.map((yValue, index) => {
                return {x: xAxisDataset[index] !== null ? xAxisDataset[index] : "", y: valueToSeriesPoint()(yValue)}
              }),
            }];
            break;
        }
      }

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
            {editor.isEditable && <SelectButton
              value={chartType}
              options={CHART_TYPES.map(type => {
                return {
                  value: type,
                  label: type === "radialBar" ? "radial bar" : type === "polarArea" ? "polar area" : type
                }
              })}
              onChange={(option) => {
                editor.updateBlock(props.block, {
                  props: {
                    chartType: option.value,
                  },
                });
              }}
            />}
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
                setXAxisDataset(undefined);
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
                setYAxisDataset(undefined);
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


        {chart !== undefined &&
          <ReactApexChart
            key={chartType} // to force full rerender upon changing chart type, to avoid ApexChart fancy/broken animations when switching charts
            type={chart.type}
            options={{...{...chart.options}, ...{id: `${props.block.id}-chart`}}}
            series={chart.series}
          />
        }
      </div>);
    },
  }
);

export default ChartBlock;
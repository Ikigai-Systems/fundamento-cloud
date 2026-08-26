import {createReactBlockSpec} from "@blocknote/react";
import {useContext, useState} from "react";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";
import AsyncSelect from 'react-select/async';
import type {SingleValue} from "react-select";
import {useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import {Config} from "@js-from-routes/client";
import ReactApexChart, {Props as ReactApexChartProps} from 'react-apexcharts'
import type {ApexOptions, ApexAxisChartSeries} from "apexcharts";
import {BlockTitle} from "../BlockTitle.tsx";
import SelectButton from "../../SelectButton.tsx";
import FormulasApi from "../../../api/FormulasApi";
import handleFormulaResultCommands from "../../formulas/handleFormulaResultCommands.ts";
import useAsyncEffect from "use-async-effect";

const CHART_TYPES = ["line", "area", "bar", "funnel", "pie", "donut", "radialBar", "scatter", "heatmap", "radar", "polarArea", "treemap"];

type CellValue = string | number | null;
type TableRow = Record<string, CellValue>;
type ChartType = ReactApexChartProps["type"];
type TableColumn = {
  npi: string;
  name: string;
};
type TableData = {
  rows: TableRow[];
  columns: TableColumn[];
};
type ChartConfig = {
  type: ChartType;
  options: ApexOptions;
  series: ApexOptions["series"];
};
type SelectOption = {
  value: string;
  label: string;
};
type TableIndexItem = {
  id: string;
  name: string;
};
type TableShowResponse = {
  data: TableData;
};
type TableQueryData = (TableShowResponse & {forceRerenderUuid: string}) | null;


export const createChartBlock = createReactBlockSpec(
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
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    // `isSelectable` moved to `meta.selectable` in the current @blocknote/core version.
    meta: {selectable: false},
    render: (props) => {
      const blockProps = props.block.props;
      const editor = props.editor;
      const {space} = useContext(CurrentSpaceContext);
      const {tableNpi, title, chartType, xAxisColumnNpi, yAxisColumnNpi} = blockProps;
      const [xAxisDataset, setXAxisDataset] = useState<CellValue[] | undefined>(undefined);
      const [yAxisDataset, setYAxisDataset] = useState<CellValue[] | undefined>(undefined);
      const tableQuery = useQuery({queryKey: ["tables", space?.id, tableNpi], queryFn: async (): Promise<TableQueryData> => {
        if (tableNpi === "") {
          return null;
        }
        const currentDataDeserializer = Config.deserializeData;
        Config.deserializeData = (val => val);
        const promiseData = TablesApi.show({id: tableNpi});
        Config.deserializeData = currentDataDeserializer;
        const data = await promiseData as TableShowResponse;
        return {...data, forceRerenderUuid: crypto.randomUUID()}
      }}, queryClient);
      const {isLoading, isError} = tableQuery;

      const useFormula = false;

      useAsyncEffect(async () => {
        if (useFormula) {
          const formulaResult = await FormulasApi.eval({data: {formula: `ForEach(Table(${tableNpi}), Dig(CurrentValue, "${xAxisColumnNpi}"))`}});
          handleFormulaResultCommands(formulaResult, space);
          setXAxisDataset(formulaResult.result as CellValue[]);
        } else {
          const xAxisColumnValues = tableQuery?.data?.data?.rows.map((row: TableRow) => row[xAxisColumnNpi]);
          setXAxisDataset(xAxisColumnValues);
        }
      }, [xAxisColumnNpi, tableQuery.data]);

      useAsyncEffect(async () => {
        if (useFormula) {
          const formulaResult = await FormulasApi.eval({data: {formula: `ForEach(Table(${tableNpi}), Dig(CurrentValue, "${yAxisColumnNpi}"))`}});
          handleFormulaResultCommands(formulaResult, space);
          setYAxisDataset(formulaResult.result as CellValue[]);
        } else {
          const yAxisColumnValues = tableQuery?.data?.data?.rows.map((row: TableRow) => row[yAxisColumnNpi]);
          setYAxisDataset(yAxisColumnValues);
        }
      }, [yAxisColumnNpi, tableQuery.data]);

      if (isLoading) {
        return (
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center text-slate-400 dark:text-gray-500">
            Loading data source table...
            <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
          </div>
        )
      }

      if (tableNpi === "") {
        return (
          <div className="divide-y divide-gray-200 dark:divide-gray-600 rounded-lg bg-white dark:!bg-gray-800 text-slate-800 dark:text-white shadow border dark:border-gray-600 min-w-[40rem] mx-auto">
            <div className="px-4 py-4 sm:px-6 flex flex-row justify-between items-center">
              <div className="font-bold">New chart</div>
              {editor.isEditable && <button
                className="flex flex-col items-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 active:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
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
                  className="fundamento-react-select-container"
                  classNamePrefix="fundamento-react-select"
                  isDisabled={!editor.isEditable}
                  cacheOptions
                  defaultOptions
                  loadOptions={async (query) => {
                    const tables: TableIndexItem[] = await TablesApi.index({
                      query: {
                        space_id: space?.id,
                        query,
                      }
                    });
                    return tables.map(table => ({value: table.id, label: table.name}));
                  }}
                  onChange={(newOption: SingleValue<SelectOption>) => {
                    if (newOption === null) {
                      return;
                    }
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
          <div className="divide-y divide-gray-200 dark:divide-gray-600 rounded-lg bg-white shadow border min-w-[40rem] mx-auto dark:text-white dark:!bg-gray-800">
            <div className="px-4 py-4 sm:px-6 flex flex-row justify-between items-center">
              <div className="text-red-800 flex items-center justify-center font-bold dark:text-red-400">
                Unable to load table with id {tableNpi}
              </div>
              <button
                className="flex flex-col items-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 active:bg-gray-100 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
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
                  className="fundamento-react-select-container"
                  classNamePrefix="fundamento-react-select"
                  cacheOptions
                  defaultOptions
                  loadOptions={async (query) => {
                    const tables: TableIndexItem[] = await TablesApi.index({
                      params: {
                        space_id: space?.id,
                        query,
                      }
                    });
                    return tables.map(table => ({value: table.id, label: table.name}));
                  }}
                  onChange={(newOption: SingleValue<SelectOption>) => {
                    if (newOption === null) {
                      return;
                    }
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

      if (tableQuery.data === null || tableQuery.data === undefined) {
        return null;
      }

      const {columns} = tableQuery.data.data;

      const valueToSeriesPoint = <T extends CellValue = null>(invalidValue: T = null as T) => (value: CellValue): number | T => {
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

      const toCategory = (data: CellValue): string => data === null ? "" : String(data);

      let chart: ChartConfig | undefined = undefined;
      if (chartType !== "" && xAxisDataset !== undefined && yAxisDataset !== undefined) {
        switch (chartType) {
          case "line":
          case "area":
          case "bar":
          case "radar":
            chart = {
              type: chartType,
              options: {
                chart: {
                  type: chartType
                },
                xaxis: {
                  categories: xAxisDataset.map(toCategory),
                }
              },
              series: [{
                name: columns.find(column => column.npi === yAxisColumnNpi)?.name,
                data: yAxisDataset.map(valueToSeriesPoint<null>())
              }] satisfies ApexAxisChartSeries,
            };
            break;
          case "funnel":
            chart = {
              type: "bar",
              options: {
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
                  // `opt` is typed as optional as of apexcharts v6, but ApexCharts always
                  // passes it for this formatter; the fallback only satisfies the type.
                  formatter: function (val, opt) {
                    return opt ? opt.w.globals.labels[opt.dataPointIndex] + ':  ' + val : `${val}`;
                  },
                  dropShadow: {
                    enabled: true,
                  },
                },
                xaxis: {
                  categories: xAxisDataset.map(toCategory),
                },
                legend: {
                  show: false,
                },
              },
              series: [{
                name: columns.find(column => column.npi === yAxisColumnNpi)?.name,
                data: yAxisDataset.map(valueToSeriesPoint<null>())
              }] satisfies ApexAxisChartSeries,
            };
            break;
          case "pie":
          case "donut":
          case "radialBar":
          case "polarArea":
            chart = {
              type: chartType,
              series: yAxisDataset.map(valueToSeriesPoint(0)),
              options: {
                chart: {
                  type: chartType,
                },
                labels: xAxisDataset.map(toCategory),
              },
            };
            break;
          case "scatter":
          case "heatmap":
            chart = {
              type: chartType,
              options: {
                chart: {
                  type: chartType,
                },
                xaxis: {
                  labels: {
                    formatter: function(val) {
                      return parseFloat(val.toString()).toFixed(1)
                    }
                  }
                },
                yaxis: {
                  labels: {
                    formatter: function(val) {
                      return val.toFixed(1)
                    }
                  }
                },
              },
              series: [{
                name: columns.find(column => column.npi === xAxisColumnNpi)?.name,
                data: yAxisDataset.map((yValue, index): [number, number | null] => {
                  return [valueToSeriesPoint<null>()(yValue) ?? 0, valueToSeriesPoint<null>()(xAxisDataset[index])];
                }),
              }] satisfies ApexAxisChartSeries,
            };
            break;
          case "treemap":
            chart = {
              type: chartType,
              options: {
                chart: {
                  type: chartType,
                }
              },
              series: [{
                data: yAxisDataset.map((yValue, index) => {
                  return {x: xAxisDataset[index] !== null ? xAxisDataset[index] : "", y: valueToSeriesPoint<null>()(yValue)}
                }),
              }] satisfies ApexAxisChartSeries,
            };
            break;
        }
      }

      return (<div className="flex flex-col w-full">
        <BlockTitle isEditable={editor.isEditable} placeholder="Untitled chart" defaultValue={title} onChange={async (value) => {
          editor.updateBlock(props.block, {
            props: {
              title: value,
            },
          });
        }}/>

        <div className="flex flex-row items-center w-full gap-8 h-8 my-3">
          <div className="flex flex-row items-center">
            <label className="text-sm mx-2">X axis</label>
            {editor.isEditable && <SelectButton
              value={xAxisColumnNpi}
              options={columns.map(column => ({value: column.npi, label: column.name}))}
              onChange={async (option) => {
                setXAxisDataset(undefined);
                editor.updateBlock(props.block, {
                  props: {
                    xAxisColumnNpi: typeof option === "object" ? option.value : option,
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
              onChange={async (option) => {
                setYAxisDataset(undefined);
                editor.updateBlock(props.block, {
                  props: {
                    yAxisColumnNpi: typeof option === "object" ? option.value : option,
                  },
                });
              }}
            />}
            {!editor.isEditable && <div className="border h-8 w-32 px-2 flex flex-row items-center justify-between rounded-lg text-sm">
              {columns.find(column => column.npi === yAxisColumnNpi)?.name || "None"}
            </div>}
          </div>
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
              onChange={async (option) => {
                editor.updateBlock(props.block, {
                  props: {
                    chartType: typeof option === "object" ? option.value : option,
                  },
                });
              }}
            />}
            {!editor.isEditable && <div className="border h-8 w-32 px-2 flex flex-row items-center justify-between rounded-lg text-sm">
              {chartType}
            </div>}
          </div>
        </div>


        {chart !== undefined && xAxisColumnNpi !== '' && yAxisColumnNpi !== '' &&
          <ReactApexChart
            key={chartType} // to force full rerender upon changing chart type, to avoid ApexChart fancy/broken animations when switching charts
            type={chart.type}
            options={{
              ...{...chart.options},
              ...{id: `${props.block.id}-chart`},
              ...{theme: {mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light"}}}
            }
            series={chart.series}
          />
        }
        {(chart === undefined || xAxisColumnNpi === '' || yAxisColumnNpi === '') &&
          <div className="border min-h-[20rem] min-w-[40rem] mx-auto flex items-center justify-center">
            Select chart axes...
          </div>
        }

      </div>);
    },
  }
);
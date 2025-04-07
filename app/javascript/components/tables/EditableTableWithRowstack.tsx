import Rowstack from "rowstack";
import {createContext, useContext, useState} from "react";
import createFlash from "../createFlash.ts"
import CurrentSpaceContext from "../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../api/Tables/TablesApi.js";
import {Config} from "@js-from-routes/client";
import {Space, Table} from "../../types.ts";
import PeopleSelectCell from "./rowstack/PeopleSelectCell.tsx";
import DocumentsSelectCell from "./rowstack/DocumentsSelectCell.tsx";
import ButtonCell from "./rowstack/ButtonCell.tsx";
import DateTimeCell from "./rowstack/DateTimeCell/DateTimeCell.tsx";
import CalendarDaysIcon from "./rowstack/DateTimeCell/CalendarDaysIcon.tsx"
import EditFormulaPopup from "./rowstack/EditFormulaPopup.tsx";
import EditDateDisplayFormatPopup from "./rowstack/DateCell/EditDateDisplayFormatPopup.tsx";
import EditDateStoredFormatPopup from "./rowstack/DateCell/EditDateStoredFormatPopup.tsx";
import queryClient from "../../contextes/ReactQueryClient.tsx";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "./rowstack-styles.css";
import EditNumberDisplayFormatPopup from "./rowstack/EditNumberDisplayFormatPopup.tsx";
import EditNumberStoredFormatPopup from "./rowstack/EditNumberStoredFormatPopup.tsx";
import EditButtonPopup from "./rowstack/EditButtonPopup.tsx";
import EditTimeDisplayFormatPopup from "./rowstack/DateTimeCell/EditTimeDisplayFormatPopup.tsx";
import {download, generateCsv, mkConfig} from "export-to-csv";
import MultiPeopleSelectCell from "./rowstack/MultiPeopleSelectCell.tsx";

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

type Kind =
    "string"
    | "number"
    | "long_text"
    | "select"
    | "date"
    | "datetime"
    | "multi_select"
    | "url"
    | "checkbox"
    | "formula"
    | "people"
    | "multi_people"
    | "documents"
    | "button";

const toType = (kind: Kind) => {
  switch (kind) {
  case "number":
    return "number";
  case "long_text":
    return "longText";
  case "select":
    return "select";
  case "date":
    return "date";
  case "datetime":
    return "datetime";
  case "multi_select":
    return "multiSelect";
  case "url":
    return "url";
  case "checkbox":
    return "checkbox";
  case "formula":
    return "formula";
  case "people": //todo: maybe rename it later to "person", also in the backend
    return "people";
  case "multi_people":
    return "multiPeople";
  case "documents":
    return "documents";
  case "button":
    return "button";
  default:
    return "text";
  }
}

export interface EditableTableContextType {
  space: Space | undefined,
  table: Table | undefined,
}

export const EditableTableContext = createContext<EditableTableContextType>({
  space: undefined,
  table: undefined,
});

export interface EditableTableRowsContextType {
  rows: any[] | undefined,
}

export const EditableTableRowsContext = createContext<EditableTableRowsContextType>({
  rows: undefined,
});


const extraColumnHeaderPopupActions = [{
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "formula") {
      return null;
    }

    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--pencil-square]"></div>
        Edit formula
      </div>
    );
  },
  popup: (popupProps) => {
    const {space, table} = useContext(EditableTableContext);
    const {rows} = useContext(EditableTableRowsContext);

    return <EditFormulaPopup rows={rows} space={space} table={table} {...popupProps}/>;
  }
}, {
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "date" && column.type !== "datetime") {
      return null;
    }
    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--computer-desktop]"></div>
        Display {column.type === "datetime" ? "date" : ""} format
      </div>
    );
  },
  popup: (popupProps) => <EditDateDisplayFormatPopup {...popupProps}/>
}, {
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "datetime") {
      return null;
    }
    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--clock]"></div>
        Display time format
      </div>
    );
  },
  popup: (popupProps) => <EditTimeDisplayFormatPopup {...popupProps}/>
}, {
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "date" && column.type !== "datetime") {
      return null;
    }
    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--circle-stack]"></div>
        Stored format
      </div>
    );
  },
  popup: (popupProps) => <EditDateStoredFormatPopup {...popupProps}/>
}, {
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "number") {
      return null;
    }
    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--computer-desktop]"></div>
        Display format
      </div>
    );
  },
  popup: (popupProps) => <EditNumberDisplayFormatPopup {...popupProps}/>
}, {
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "number") {
      return null;
    }
    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--circle-stack]"></div>
        Stored format
      </div>
    );
  },
  popup: (popupProps) => <EditNumberStoredFormatPopup {...popupProps}/>
}, {
  section: "actions2",
  menuItem: ({column, showPopup}) => {
    const {space, table} = useContext(EditableTableContext);

    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={async () => {
          const spaceNpi = space.npi;
          const tableNpi = table.npi;
          await TablesApi.moveColumnLeft({
            params: {npi: tableNpi},
            data: {colId: column.id}
          });
          queryClient.invalidateQueries({queryKey: ["tables", spaceNpi, tableNpi]});
        }}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--arrow-left-circle]"></div>
        Move column left
      </div>
    );
  },
}, {
  section: "actions2",
  menuItem: ({column, showPopup}) => {
    const {space, table} = useContext(EditableTableContext);

    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={async () => {
          const spaceNpi = space.npi;
          const tableNpi = table.npi;
          await TablesApi.moveColumnRight({
            params: {npi: tableNpi},
            data: {colId: column.id}
          });
          queryClient.invalidateQueries({queryKey: ["tables", spaceNpi, tableNpi]});
        }}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--arrow-right-circle]"></div>
        Move column right
      </div>
    );
  },
}, {
  section: "main",
  menuItem: ({column, showPopup}) => {
    if (column.type !== "button") {
      return null;
    }
    return (
      <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default"
        onClick={showPopup}
      >
        <div className="w-5 h-5 mr-1 icon-[heroicons--pencil-square]"></div>
        Edit button
      </div>
    );
  },
  popup: (popupProps) => <EditButtonPopup {...popupProps}/>
}];

// we had played with three other libraries for rendering tables (aside Rowstack), you can find working PoC by following fulll git-blame on this comment line

const EditableTableWithRowstack = ({isEditable = true, table, data, forceRerenderUuid, initialViewProps, onViewPropsChange = () => {}}: EditableTableWithRowstackProps) => {
  const {space} = useContext(CurrentSpaceContext);

  const columns = data.columns.map(({npi, name, kind, options, formula, configuration}) => ({
    isViewOnly: !isEditable,
    id: npi,
    name,
    type: toType(kind),
    options,
    fundamentoFormula: formula,
    configuration,
    ...initialViewProps?.columns[npi]
  }));

  const rows = data.rows.map(({npi, ...row}) => ({...row, id: npi}));

  columns.filter(({type}) => type === "formula").forEach(column => {
    column.formula = (row) => {
      const formulaResult = row[column.id];
      if (typeof formulaResult === 'object' && formulaResult !== null) {
        return JSON.stringify(formulaResult);
      } else {
        return row[column.id]?.toString();
      }
    }
  });

  return (<div className="ikigai-rowstack-overrides">
    <EditableTableContext.Provider value={{space, table}}>
      <EditableTableRowsContext.Provider value={{rows}}>
        <Rowstack
          key={forceRerenderUuid}
          columns={columns}
          data={rows}
          config={{
            addRow: {enabled: isEditable},
            addColumn: {enabled: isEditable},
            editColumns: {enabled: isEditable},
            selectRow: {enabled: isEditable},
            extraColumnTypes: [{
              type: "people",
              cell: PeopleSelectCell,
              icon: () => <div className="w-4 h-4 mr-2 icon-[heroicons--user]"></div>,
              name: "Single Person",
            }, {
              type: "multiPeople",
              cell: MultiPeopleSelectCell,
              icon: () => <div className="w-4 h-4 mr-2 icon-[heroicons--users]"></div>,
              name: "Multiple People",
            }, {
              type: "documents",
              cell: DocumentsSelectCell,
              icon: () => <div className="w-4 h-4 mr-2 icon-[heroicons--document-text]"></div>,
              name: "Documents",
            }, {
              type: "datetime",
              cell: DateTimeCell,
              icon: CalendarDaysIcon,
              name: "Date and time",
            }, {
              type: "button",
              cell: ButtonCell,
              icon: () => <div className="w-4 h-4 mr-2 icon-[heroicons--bolt]"></div>,
              name: "Button",
            }],
            extraColumnHeaderPopupActions: extraColumnHeaderPopupActions,
            extraToolbarItems: [{
              render: () => {
                const [isDownloadingAsCsv, setIsDownloadingAsCsv] = useState(false);

                return (<>
                  <button style={{marginLeft: "auto"}} className="secondary-button p-2" title="Download as CSV"
                    disabled={isDownloadingAsCsv}
                    onClick={async () => {
                      setIsDownloadingAsCsv(true);
                      try {
                        const currentDataDeserializer = Config.deserializeData;
                        Config.deserializeData = (val => val);
                        const promiseData = TablesApi.show({npi: table.npi});
                        Config.deserializeData = currentDataDeserializer;
                        const tableData = await promiseData;

                        const {columns, rows} = tableData.data;
                        const csvConfig = mkConfig({
                          columnHeaders: columns.map((column: any) => ({key: column.npi, displayLabel: column.name})),
                          filename: `${tableData.table.name}_${dayjs().toISOString()}`,
                          useBom: false,
                        });
                        const csv = generateCsv(csvConfig)(rows.map((row: any) => {
                          const obj = {};
                          Object.entries(row).map(([key, value]) => obj[key] = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value !== null ? value : "");
                          return obj;
                        }));
                        download(csvConfig)(csv);
                      } finally {
                        setIsDownloadingAsCsv(false);
                      }
                    }}>
                    <div className="bg-slate-500 size-5 icon-[heroicons--arrow-down-tray]"></div>
                  </button>
                </>)
              }
            }, {
              render: () => {
                return (<>
                  {table && <div
                    title={`Click to copy this table ID (${table.npi}) to clipboard - you can use it in formulas`}
                    className="text-slate-400 text-sm truncate max-w-24 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(table.npi);
                      createFlash({
                        type: "info",
                        message: `Table ID (${table.npi}) copied to clipboard.`
                      })
                    }}
                  >
                    {table.npi}
                  </div>}
                </>)
              }
            }],
            parseDate: (value, columnConfiguration) => {
              if (!value) {
                return null;
              }
              let dateDayJs;
              switch (columnConfiguration?.dateStoredFormat) {
              case 0:
                dateDayJs = dayjs(value, ["M/D/YYYY HH:mm", "M/D/YYYY"]);
                break;
              case 1:
                dateDayJs = dayjs(value, ["D/M/YYYY HH:mm", "D/M/YYYY"]);
                break;
              case 2:
                dateDayJs = dayjs(value, ["DD.MM.YYYY HH:mm", "DD.MM.YYYY"]);
                break;
              case 3:
                dateDayJs = dayjs(value, ["YYYY-MM-DD HH:mm", "YYYY-MM-DD"]);
                break;
              default:
                dateDayJs = dayjs(value);
                break;
              }
              const date = dateDayJs.toDate();
              if (!dateDayJs.isValid()) {
                date._isValid = false;
                date._originalValue = value;
              }
              return date;
            },
            formatStoredDate: (parsedData, columnConfiguration) => {
              if (parsedData === null) {
                return "";
              }
              if (parsedData?._isValid === false) {
                return parsedData._originalValue;
              }
              const dayDate = dayjs(parsedData);
              switch (columnConfiguration?.dateStoredFormat) {
              case 0:
                return dayDate.format("M/D/YYYY");
              case 1:
                return dayDate.format("D/MM/YYYY");
              case 2:
                return dayDate.format("DD.MM.YYYY");
              case 3:
                return dayDate.format("YYYY-MM-DD");
              default:
                return dayDate.format("L");
              }
            },
            formatDisplayDate: (parsedData, columnConfiguration) => {
              if (parsedData._isValid === false) {
                return "Invalid Date";
              }
              const dayDate = dayjs(parsedData);
              switch (columnConfiguration?.dateDisplayFormat) {
              case 0:
                return dayDate.format("M/D/YYYY");
              case 1:
                return dayDate.format("M/D/YY");
              case 2:
                return dayDate.format("M/D");
              case 3:
                return dayDate.format("MMMM D, YYYY");
              case 4:
                return dayDate.format("MMM D, YYYY");
              case 5:
                return dayDate.format("MMM D");
              case 6:
                return dayDate.format("ddd, MMM D");
              case 7:
                return dayDate.format("ddd, MMM D, YYYY");
              case 8:
                return dayDate.format("DD/MM/YYYY");
              case 9:
                return dayDate.format("DD.MM.YYYY");
              case 10:
                return dayDate.format("DD.MM");
              case 11:
                return dayDate.format("YYYY-MM-DD");
              case 12:
                return dayDate.format("MMMM YYYY");
              case 13:
                return dayDate.format("dddd");
              case 14:
                return dayDate.format("D");
              case 15:
                return dayDate.format("MMMM");
              case 16:
                return dayDate.format("YYYY");
              case 17:
                return dayDate.format("MMM YYYY");
              default:
                return dayDate.format("L");
              }
            },
            parseNumber: (value, columnConfiguration) => {
              if (!value) {
                return null;
              }

              switch (columnConfiguration?.numberStoredFormat) {
              case "0.01":
                return Number(value);
              case "0,01":
                return Number(value.replaceAll(",","."));
              default:
                return Number(value);
              }
            },
            formatDisplayNumber: (parsedData, columnConfiguration) => {
              if (parsedData === null) {
                return "";
              }

              if (isNaN(parsedData)) {
                return "Invalid Number";
              }

              switch (columnConfiguration?.numberDisplayFormat) {
              case "0.01":
                return parsedData.toLocaleString("en-US", {maximumFractionDigits: 100});
              case "0,01":
                return parsedData.toLocaleString("pt-BR", {maximumFractionDigits: 100});
              default:
                return parsedData.toString();
              }
            }
          }}
          onChange={async (event) => {
            if (event.type === "update_column" && event.update?.width !== undefined) {
              onViewPropsChange({columns: {[event.colId]: {width: event.update.width}}});
            }

            if ((event.type === "update_column" && Object.keys(event.update).length === 1 && event.update.width !== undefined)
                  || (event.type === "update_row" && Object.keys(event.update).length === 1 && event.update.isSelected !== undefined)
            ) {
              return; // skip frontend-session related changes from being passed to the backend
            }

            if (!isEditable) {
              //sanity guard: in read-only mode Rowstack shouldn't emit legitimate row/column update events other than column width
              return;
            }

            try {
              const currentDataSerializer = Config.serializeData;
              Config.serializeData = (val => val);
              const promise = TablesApi.updateByRowstack({
                params: {npi: table.npi},
                data: {event}
              });
              Config.serializeData = currentDataSerializer;
              await promise;
              if (event.type === "update_column" && event.update?.fundamentoFormula !== undefined) {
                queryClient.invalidateQueries({queryKey: ["tables", space.npi, table.npi]});
              }
            } catch (e) {
              //todo: Sentry.capture(e)
              createFlash({
                key: "table_update_failed",
                type: "error",
                message: "Failed to update the table, please reload page and try again."
              });
            }
          }}
        />  
      </EditableTableRowsContext.Provider>
    </EditableTableContext.Provider>
  </div>);
};

type Row = {
  id: string,
  [key: string]: string,
}

type Column = {
  id: string,
  name: string,
  npi: string,
  kind: Kind,
  formula: string,
  configuration: any,
  options: any,
}

export type TableData = {
  rows: Array<Row>,
  columns: Array<Column>,
}

type EditableTableWithRowstackProps = {
  isEditable: boolean,
  table: Table,
  data: TableData,
  forceRerenderUuid: string,
  initialViewProps: TableData,
  onViewPropsChange: (any) => void,
}

export default EditableTableWithRowstack;

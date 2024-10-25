import Rowstack from "../../libs/rowstack/main.js";
import {useContext} from "react";
import createFlash from "../createFlash.ts"
import CurrentSpaceContext from "../../contextes/CurrentSpaceContext.tsx";
import TablesApi from "../../api/Tables/TablesApi.js";
import {Config} from "@js-from-routes/client";
import {Table} from "../../types.ts";
import PeopleSelectCell from "./rowstack/PeopleSelectCell.tsx";
import EditFormulaPopup from "./rowstack/EditFormulaPopup.tsx";
import EditDateFormatPopup from "./rowstack/EditDateFormatPopup.tsx";
import queryClient from "../../contextes/ReactQueryClient.tsx";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

const toType = (kind: "string" | "integer" | "long_text" | "select" | "date" | "multi_select" | "url" | "checkbox") => {
  switch (kind) {
  case "integer":
    return "number";
  case "long_text":
    return "longText";
  case "select":
    return "select";
  case "date":
    return "date";
  case "multi_select":
    return "multiSelect";
  case "url":
    return "url";
  case "checkbox":
    return "checkbox";
  case "formula":
    return "formula";
  case "people":
    return "people";
  default:
    return "text";
  }
}

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
    column.formula = (row) => row[column.id];
  });

  return (<div className="flex flex-col">
    <input
      key={table.id + "_name"}
      type="text"
      placeholder="Untitled"
      defaultValue={table.name}
      className="-my-2 p-0 h-12 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-2xl font-bold text-slate-800"
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
        if (newName !== table.name) {
          try {
            await TablesApi.update({params: {space_npi: space.npi, id: table.id}, data: {name: e.target.value}});
          } catch (e) {
            const errorMessage = (e.response?.data?.errors)
              ? Object.entries(e.response.data.errors).map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)} ${value}`).join("<br/>")
              : "Failed to update the table, please reload page and try again.";
            createFlash({
              type: "error",
              message: errorMessage,
            })
          }
        }
      }}
    >
    </input>

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
          name: "People",
        }],
        extraColumnHeaderPopupActions: [{
          section: "main",
          menuItem: ({column, showPopup}) => {
            if (column.type !== "formula") {
              return null;
            }
            return (
              <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default" onClick={showPopup}>
                <div className="w-5 h-5 mr-1 icon-[heroicons--pencil-square]"></div>
                Edit formula
              </div>
            );
          },
          popup: (popupProps) => <EditFormulaPopup rows={rows} table={table} {...popupProps}/>
        },{
          section: "main",
          menuItem: ({column, showPopup}) => {
            if (column.type !== "date") {
              return null;
            }
            return (
              <div className="flex flex-row items-center px-3 py-1 hover:bg-neutral-50 cursor-default" onClick={showPopup}>
                <div className="w-5 h-5 mr-1 icon-[heroicons--pencil-square]"></div>
                Edit format
              </div>
            );
          },
          popup: (popupProps) => <EditDateFormatPopup {...popupProps}/>
        }],
        formatDate: ({parsedData, configuration}) => {
          const dayDate = dayjs(parsedData);
          switch (configuration?.dateFormat) {
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

        const currentDataSerializer = Config.serializeData;
        try {
          Config.serializeData = (val => val);
          await TablesApi.updateByRowstack({
            params: {space_npi: space.npi, id: table.id},
            data: {event}
          });
          if (event.type === "update_column" && event.update?.fundamentoFormula !== undefined) {
            queryClient.invalidateQueries({queryKey: ["tables", space.npi, table.id]});
          }
        } catch (e) {
          //todo: Sentry.capture(e)
          createFlash({
            key: "table_update_failed",
            type: "error",
            message: "Failed to update the table, please reload page and try again."
          })
        } finally {
          Config.serializeData = currentDataSerializer;
        }
      }}
    />
  </div>);
};

type Row = {
  id: string,
  [key: string]:string,
}

type Column = {
  id: string,
  name: string,
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
  initialViewProps: object,
  onViewPropsChange: (any) => void,
}

export default EditableTableWithRowstack;

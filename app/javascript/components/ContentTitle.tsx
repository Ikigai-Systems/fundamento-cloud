import {Document, Space, Table} from "../types.js";
import createFlash from "./createFlash.ts";
import TablesApi from "../api/Tables/TablesApi.js";
import {UNTITLED_CONTENT} from "./EditableContentTitle.tsx";

type ContentTitleProps = {
  document?: Document,
  table?: Table,
  extraClasses?: string,
}

export const ContentTitle = ({document, table, extraClasses}: ContentTitleProps) => {
  return <div
    className={`content-title${extraClasses ? ` ${extraClasses}` : ""}`}>
    {document?.title || table?.name || UNTITLED_CONTENT}
  </div>;
}

type TableTitleInputProps = {
  table: Table,
  space: Space,
  extraClasses?: string,
}

export const TableTitleInput = ({table, space, extraClasses}: TableTitleInputProps) => {
  return <input
    key={space.id + "_" + table.id + "_name"}
    type="text"
    placeholder={UNTITLED_CONTENT}
    defaultValue={table.name === UNTITLED_CONTENT ? undefined : table.name}
    className={`content-title-input${extraClasses ? ` ${extraClasses}` : ""}`}
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
          await TablesApi.update({
            params: {id: table.id},
            data: {name: e.target.value},
          });
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
  </input>;
}

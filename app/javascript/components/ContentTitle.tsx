import {Document, Space, Table} from "../types.js";
import createFlash from "./createFlash.ts";
import DocumentsApi from "../api/DocumentsApi.js";
import TablesApi from "../api/Tables/TablesApi.js";

type ContentTitleProps = {
  document?: Document,
  table?: Table,
  extraClasses?: string,
}

const UNTITLED_CONTENT = "Untitled";

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
    key={space.npi + "_" + table.npi + "_name"}
    type="text"
    placeholder={UNTITLED_CONTENT}
    defaultValue={table.name}
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
            params: {npi: table.npi},
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

type DocumentTitleInputProps = {
  document: Document,
  extraClasses?: string,
}

export const DocumentTitleInput = ({document, extraClasses}: DocumentTitleInputProps) => {
  return <>
    <input
      key={document.id + "_title"}
      type="text"
      autoFocus={!document.title}
      placeholder={UNTITLED_CONTENT}
      defaultValue={document.title}
      className={`content-title-input${extraClasses ? ` ${extraClasses}` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
        } else if (e.key === "Escape") {
          if (e.target instanceof HTMLInputElement) {
            e.target.value = document.title;
            e.target.blur();
          }
        }
      }}
      onBlur={async (e) => {
        const newTitle = e.target.value;
        if (newTitle !== document.title) {
          const updatedDocument = await DocumentsApi.update({
            params: document,
            data: {title: e.target.value}
          });
          const sideBarElement = window.document.querySelector(`[data-document-id="${updatedDocument.id}"]`);
          if (sideBarElement) {
            sideBarElement.innerHTML = updatedDocument.title;
          }
          document = updatedDocument; //todo: ensure this work in React world
        }
      }}
    >
    </input>
  </>;
}
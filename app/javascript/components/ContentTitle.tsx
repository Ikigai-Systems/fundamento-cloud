import {Document, Space, Table} from "../types.js";
import createFlash from "./createFlash.ts";
import DocumentsApi from "../api/DocumentsApi";
import TablesApi from "../api/Tables/TablesApi";

type ContentTitleProps = {
    document: Document,
    table: Table,
}

const UNTITLED_CONTENT = "Untitled";

export const ContentTitle = ({document, table}: ContentTitleProps) => {
  return <div
    className="content-title">
    {document?.title || table?.name || UNTITLED_CONTENT}
  </div>;
}

type TableTitleInputProps = {
    table: Table,
    space: Space,
}

export const TableTitleInput = ({table, space}: TableTitleInputProps) => {
  return <input
    key={table.id + "_name"}
    type="text"
    placeholder={UNTITLED_CONTENT}
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
          await TablesApi.update({
            params: {space_npi: space.npi, id: table.id},
            data: {name: e.target.value}
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
}

export const DocumentTitleInput = ({document}: DocumentTitleInputProps) => {
  return <>
    <input key={document.id + "_title"} type="text" autoFocus={!document.title}
      placeholder={UNTITLED_CONTENT}
      defaultValue={document.title}
      className="document-title"
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
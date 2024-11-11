import {Document, Table} from "../types.js";

type ContentTitleProps = {
    document: Document,
    table: Table,
}

export const ContentTitle = ({document, table}: ContentTitleProps) => {
  return <div
    className="content-title">
    {document?.title || table?.name || "Untitled"}
  </div>;
}
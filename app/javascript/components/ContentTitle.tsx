import {Document} from "../types.js";

type ContentTitleProps = {
    document: Document,
}

export const ContentTitle = ({document}: ContentTitleProps) => {
  return <div
    className="content-title">
    {document.title || "Untitled"}
  </div>;
}
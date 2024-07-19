import React, {useState} from "react"
import {Document, User} from "../../../frontend/src/types";
import Editor from "./editor/Editor";

type EditDocumentPageProps = {
  document: Document
}

const EditDocumentPage = ({document}: EditDocumentPageProps) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [user] = useState<User>({
    displayName: urlParams.get("displayName") || "unknown user",
    color: (urlParams.get("color")) ? "#" + urlParams.get("color") : `hsl(${~~(360 * Math.random())}, 72%,  78%)`,
  });

  return <>
    <input key={document.id + "_title"} type="text"
      placeholder="Untitled"
      defaultValue={document.title}
      className="p-0 pl-12 h-12 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-4xl"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
        }
      }}
    >
    </input>

    <Editor
      initialContent={document.content}
      user={user}
      documentId={document.id}
    />
  </>
}

export default EditDocumentPage;
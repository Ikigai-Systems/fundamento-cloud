import React, {useState} from "react"
import {User, Document} from "../../../frontend/src/types";
import Editor from "./Editor";

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
    <Editor
      initialContent={document.content}
      user={user}
      documentId={document.id}
    />
  </>
}

export default EditDocumentPage;
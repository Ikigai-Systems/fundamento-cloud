import React, {useState} from "react"
import {Document, User} from "../../../frontend/src/types";

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
    <div>Document.id: {document.id}, user: {user.displayName}</div>
  </>
}

export default EditDocumentPage;
import axios from "axios";
import {Document, User} from "../../types.ts";
import {Params, useLoaderData} from "react-router-dom";
import Editor from "../../Editor/Editor.tsx";
import {useState} from "react";

export const documentLoader = async ({params}: {params: Params<"documentId">}) => {
  //todo: reuse already fetched document (i.e. from '/spaces/:spaceId/' route) if possible
  const document = (await axios.get(`/api/v1/documents/${params.documentId}`)).data as Document;
  return {document};
};

// type DocumentChildProps = {
// }

const DocumentRoute = (/*DocumentProps*/) => {
  const {document} = useLoaderData() as {document: Document};
  console.log("DOCUMENT", document);

  const urlParams = new URLSearchParams(window.location.search);
  const [user] = useState<User>({
    displayName: urlParams.get("displayName") || "unknown user",
    color: (urlParams.get("color")) ? "#" + urlParams.get("color") : `hsl(${~~(360 * Math.random())}, 72%,  78%)`,
  });

  if (document === undefined) {
    console.log("document === undefined")
    return <div>Loading...</div>
  }

  return <Editor
    initialContent={document.content}
    user={user}
    documentId={document.id}
  />
}

export default DocumentRoute;
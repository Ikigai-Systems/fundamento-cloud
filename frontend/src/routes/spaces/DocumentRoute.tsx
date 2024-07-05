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

  const urlParams = new URLSearchParams(window.location.search);
  const [user] = useState<User>({
    displayName: urlParams.get("displayName") || "unknown user",
    color: (urlParams.get("color")) ? "#" + urlParams.get("color") : `hsl(${~~(360 * Math.random())}, 72%,  78%)`,
  });

  if (document === undefined) {
    return <div>Loading...</div>
  }

  return <>
    <input key={document.id + "_title"} type="text"
      placeholder="Untitled"
      defaultValue={document.title}
      className="p-0 h-13 b-none active:b-none w-full resize-none text-5xl"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
        }
      }}
      onBlur={async (e) => {
        const response = await axios.patch(`api/v1/documents/${document.id}`, {document: {
          title: e.target.value
        }});

        console.log(e.target.value);
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

export default DocumentRoute;
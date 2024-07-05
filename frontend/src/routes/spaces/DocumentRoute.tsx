import axios from "axios";
import {Document, User} from "../../types.ts";
import {useParams} from "react-router-dom";
import Editor from "../../Editor/Editor.tsx";
import {useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";

const DocumentRoute = (/*DocumentProps*/) => {
  const queryClient = useQueryClient();
  const {documentId} = useParams();
  const documentQuery = useQuery({queryKey: ["documents", documentId], queryFn: async () => {
    return (await axios.get(`/api/v1/documents/${documentId}`)).data as Document;
  }});

  const urlParams = new URLSearchParams(window.location.search);
  const [user] = useState<User>({
    displayName: urlParams.get("displayName") || "unknown user",
    color: (urlParams.get("color")) ? "#" + urlParams.get("color") : `hsl(${~~(360 * Math.random())}, 72%,  78%)`,
  });

  const document = documentQuery.data;

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
        await axios.patch(`api/v1/documents/${document.id}`, {document: {
          title: e.target.value,
        }});
        await queryClient.invalidateQueries({queryKey: ['documents', documentId]});
        await queryClient.invalidateQueries({queryKey: ['documents'], exact: true});
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
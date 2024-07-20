import {useState} from "react"
import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../Contextes/CurrentSpaceContext";

const queryClient = new QueryClient();

type EditDocumentPageProps = {
  document: Document
  space: Space
}

const EditDocumentPage = ({document, space}: EditDocumentPageProps) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [user] = useState<User>({
    displayName: urlParams.get("displayName") || "unknown user",
    color: (urlParams.get("color")) ? "#" + urlParams.get("color") : `hsl(${~~(360 * Math.random())}, 72%,  78%)`,
  });

  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
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

      <div className="editor-container">
        <Editor
          initialContent={document.content}
          user={user}
          documentId={document.id}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPage;
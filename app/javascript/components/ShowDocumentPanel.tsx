import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
}

const EditDocumentPanel = ({document, space, currentUser}: EditDocumentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <div
        className="pl-[3.4rem] min-h-12 mt-1 -mb-1 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-4xl text-slate-800">
        {document.title || "Untitled"}
      </div>

      <div className="editor-container">
        <Editor
          currentUser={currentUser}
          documentId={document.id}
          editable={false}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPanel;
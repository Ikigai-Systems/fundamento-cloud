import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {ContentTitle} from "./ContentTitle.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
}

const EditDocumentPanel = ({document, space, currentUser}: EditDocumentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <ContentTitle document={document}/>

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
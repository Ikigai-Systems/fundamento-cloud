import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {DocumentTitleInput} from "./ContentTitle.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
  databaseId: string,
}

const EditDocumentPanel = ({document, space, currentUser, databaseId}: EditDocumentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <div className="content-editor-padding">
        <DocumentTitleInput document={document}/>
      </div>

      <div className="editor-container">
        <Editor
          currentUser={currentUser}
          document={document}
          databaseId={databaseId}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPanel;
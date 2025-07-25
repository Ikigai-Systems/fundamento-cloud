import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {DocumentTitleInput} from "./ContentTitle.tsx";
import HtmlEditor from "./HtmlEditor/HtmlEditor.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
  databaseId: string,
  contentHtml: string,
  revisions: string,
  operations?: string,
}

const EditDocumentPanel = ({document, space, currentUser, databaseId, contentHtml, revisions, operations}: EditDocumentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <div className="content-editor-padding">
        <DocumentTitleInput document={document}/>
      </div>

      <div className="html-editor-container">
        <HtmlEditor initialData={contentHtml} revisions={JSON.parse(revisions || "[]")} operations={JSON.parse(operations || "[]")} document={document} currentUser={currentUser}/>
      </div>

      <div className="editor-container">
        <Editor
          currentUser={currentUser}
          document={document}
          databaseId={databaseId}
          contentHtml={contentHtml}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPanel;
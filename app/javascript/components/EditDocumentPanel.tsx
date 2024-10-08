import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import DocumentsApi from "../api/DocumentsApi.js";
import queryClient from "../contextes/ReactQueryClient.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
}

type DocumentTitleInputProps = {
  document: Document,
}

const DocumentTitleInput = ({document} : DocumentTitleInputProps) => {
  return <>
    <input key={document.id + "_title"} type="text" autoFocus={!document.title}
      placeholder="Untitled"
      defaultValue={document.title}
      className="document-title"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
        } else if (e.key === "Escape") {
          if (e.target instanceof HTMLInputElement) {
            e.target.value = document.title;
            e.target.blur();
          }
        }
      }}
      onBlur={async (e) => {
        const newTitle = e.target.value;
        if (newTitle !== document.title) {
          const updatedDocument = await DocumentsApi.update({params: document, data: {title: e.target.value}});
          const sideBarElement = window.document.querySelector(`[data-document-id="${updatedDocument.id}"]`);
          if (sideBarElement) {
            sideBarElement.innerHTML = updatedDocument.title;
          }
          document = updatedDocument; //todo: ensure this work in React world
        }
      }}
    >
    </input>
  </>;
}

const EditDocumentPanel = ({document, space, currentUser}: EditDocumentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <DocumentTitleInput document={document}/>

      <div className="editor-container">
        <Editor
          currentUser={currentUser}
          documentId={document.id}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPanel;
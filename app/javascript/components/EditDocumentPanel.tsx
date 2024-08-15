import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../Contextes/CurrentSpaceContext";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import DocumentsApi from "~/api/DocumentsApi";
import queryClient from "../Contextes/ReactQueryClient.tsx";

type EditDocumentPanelProps = {
  document: Document
  space: Space
  currentUser: User
}

const EditDocumentPanel = ({document, space, currentUser}: EditDocumentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <input key={document.id + "_title"} type="text" autoFocus={!document.title}
        placeholder="Untitled"
        defaultValue={document.title}
        className="pl-[3.4rem] h-12 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-4xl text-slate-800"
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

      <div className="editor-container">
        <Editor
          initialContent={document.content}
          currentUser={currentUser}
          documentId={document.id}
        />
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPanel;
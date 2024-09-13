import {Document, Version, Space, User} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../Contextes/CurrentSpaceContext";
import queryClient from "../Contextes/ReactQueryClient.tsx";
import {useCreateBlockNote} from "@blocknote/react";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import "./editor/editor-styles.css";
import schema from "./editor/schema.ts";
import {resolveFileUrl, uploadFile} from "./editor/Editor.tsx";

type EditDocumentPanelProps = {
  version: Version,
  document: Document,
  space: Space,
  currentUser: User,
}

const EditDocumentPanel = ({version, document, space}: EditDocumentPanelProps) => {
  const editor = useCreateBlockNote({
    schema,
    initialContent: version.content,
    resolveFileUrl: resolveFileUrl,
  });

  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <div className="pl-[3.4rem] min-h-12 mt-1 -mb-1 border-0 focus:[box-shadow:none] border-0 w-full resize-none text-4xl text-slate-800">
        {document.title || "Untitled"}
      </div>

      <div className="editor-container">
        <BlockNoteView editor={editor} editable={false}/>
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditDocumentPanel;
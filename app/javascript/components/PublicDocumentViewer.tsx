import {useMemo} from "react";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import * as Y from "yjs";
import '@blocknote/mantine/style.css';
import schema from "./editor/schema";
import PublicApi from "../api/PublicApi.js";
import {createFileUrlResolver} from "./editor/utils/createFileUrlResolver.tsx";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";


type PublicDocumentViewerProps = {
  document: Document,
  space: Space,
}

function decodeBase64ToBinary(update: string) {
  return Uint8Array.from(atob(update), c => c.charCodeAt(0));
}

const PublicDocumentViewer = ({document, space}: PublicDocumentViewerProps) => {
  const editor = useMemo(() => {
    const yDoc = new Y.Doc();
    Y.applyUpdate(yDoc, decodeBase64ToBinary(document.sync));
    const blockNoteEditor = BlockNoteEditor.create({
      schema,
      // initialContent: yDoc.getXmlFragment("document-storage"),
      collaboration: {
        fragment: yDoc.getXmlFragment("document-store"),
      },
      resolveFileUrl: createFileUrlResolver(PublicApi.attachment.path)
    });
    return blockNoteEditor;
  }, [document]);

  return (
    <QueryClientProvider client={queryClient}>
      <CurrentSpaceContext.Provider value={{space}}>
        <div className="editor-container">
          <BlockNoteView editor={editor} editable={false} className={"read-only"}/>
        </div>
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  );
}

export default PublicDocumentViewer;
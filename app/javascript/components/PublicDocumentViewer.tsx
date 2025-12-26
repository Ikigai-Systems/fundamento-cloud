import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import schema from "./editor/schema";
import PublicApi from "../api/PublicApi.js";
import {createFileUrlResolver} from "./editor/utils/createFileUrlResolver.tsx";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {Document, Space, Version} from "../types.ts";
import {useCreateBlockNote} from "@blocknote/react";
import {ContentTitle} from "./ContentTitle.tsx";

type PublicDocumentViewerProps = {
  document: Document,
  version: Version,
  space: Space,
}

const PublicDocumentViewer = ({document, version, space}: PublicDocumentViewerProps) => {
  const editor = useCreateBlockNote({
    schema,
    initialContent: version.content,
    resolveFileUrl: createFileUrlResolver(PublicApi.attachment.path)
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CurrentSpaceContext.Provider value={{space}}>
        <div className="px-5">
          <ContentTitle document={document}/>
        </div>

        <div className="editor-container">
          <BlockNoteView editor={editor} editable={false} className={"read-only"} data-document-editor/>
        </div>
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  );
}

export default PublicDocumentViewer;
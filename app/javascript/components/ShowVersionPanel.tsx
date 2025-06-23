import {Document, Space, Version} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from ".././contextes/CurrentSpaceContext";
import queryClient from ".././contextes/ReactQueryClient.tsx";
import {useCreateBlockNote} from "@blocknote/react";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import "./editor/editor-styles.css";
import schema from "./editor/schema.ts";

import {createFileUrlResolver} from "./editor/utils/createFileUrlResolver.tsx";
import {ContentTitle} from "./ContentTitle.tsx";

import 'ckeditor5/ckeditor5.css';
import HtmlEditor from "./HtmlEditor/HtmlEditor.tsx";

type EditDocumentPanelProps = {
  version: Version,
  document: Document,
  space: Space,
}

const ShowVersionPanel = ({version, document, space}: EditDocumentPanelProps) => {
  const editor = useCreateBlockNote({
    schema,
    initialContent: version.contentBlocks,
    resolveFileUrl: createFileUrlResolver(),
  });

  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <div className="content-editor-padding">
        <ContentTitle document={document}/>
      </div>

      <div className="html-editor-container">
        <HtmlEditor initialData={version.contentHtml} channelId={document.id.toString()} disabled={true}/>
      </div>

      <div className="editor-container">
        <BlockNoteView editor={editor} editable={false}/>
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default ShowVersionPanel;
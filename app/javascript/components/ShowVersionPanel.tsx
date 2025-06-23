import {Document, Version, Space} from "../types";
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
import {CKEditor} from "@ckeditor/ckeditor5-react";
import {
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  MediaEmbed,
  Paragraph, Table, Undo
} from "ckeditor5";

import 'ckeditor5/ckeditor5.css';

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
        <CKEditor
          editor={ ClassicEditor }
          disabled={true}
          onReady={ editor => {
            window.ckEditor = editor;
          }}
          config={ {
            toolbar: [
              'undo', 'redo', '|',
              'heading', '|', 'bold', 'italic', '|',
              'link', 'insertTable', 'mediaEmbed', '|',
              'bulletedList', 'numberedList', 'indent', 'outdent'
            ],
            plugins: [
              Bold,
              Essentials,
              Heading,
              Indent,
              IndentBlock,
              Italic,
              Link,
              List,
              MediaEmbed,
              Paragraph,
              Table,
              Undo
            ],
            initialData: version.contentHtml,
            licenseKey: window.FundamentoConfig.ckeditor.licenseKey,
          } }
        />

      </div>

      <div className="editor-container">
        <BlockNoteView editor={editor} editable={false}/>
      </div>
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default ShowVersionPanel;
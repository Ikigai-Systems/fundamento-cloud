import {useMemo} from "react";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import * as Y from "yjs";
import '@blocknote/mantine/style.css';
import schema from "./editor/schema";
import PublicApi from "../api/PublicApi";
import {createFileUrlResolver} from "./editor/utils/createFileUrlResolver.tsx";

type ReadOnlyEditorProps = {
    documentContent: string,
}

function decodeBase64ToBinary(update: string) {
  return Uint8Array.from(atob(update), c => c.charCodeAt(0));
}

const PublicDocumentViewer = ({document}: ReadOnlyEditorProps) => {
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
    <BlockNoteView editor={editor} editable={false}/>
  );
}

export default PublicDocumentViewer;
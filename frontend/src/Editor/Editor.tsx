import '@blocknote/mantine/style.css';
import {useContext, useMemo} from "react";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import * as Y from "yjs";
import {WebsocketProvider} from "y-websocket";
import {User} from "../types.ts";
import {CurrentDocumentContext} from "../Contextes/CurrentDocumentContext.tsx";
import axios from "axios";

let doc: Y.Doc | undefined = undefined;
let wsProvider: WebsocketProvider | undefined = undefined;
type Event = {
  status: string
}

type EditorProps = {
  initialContent: string, // probably not needed
  user: User,
}

const Editor = ({user}: EditorProps) => {
  const {documentId} = useContext(CurrentDocumentContext);

  const editor = useMemo(() => {
    console.log(documentId);
    if (doc) {
      doc.destroy();
    }
    doc = new Y.Doc();

    if (wsProvider) {
      wsProvider.destroy();
    }
    wsProvider = new WebsocketProvider(`ws://${window.location.hostname}:1234`, `/documents/${documentId}`, doc)
    wsProvider.on('status', (event: Event) => {
      console.log(event.status) // logs "connected" or "disconnected"
    });

    return BlockNoteEditor.create({
      // initialContent: JSON.parse(initialContent),
      collaboration: {
        provider: wsProvider,
        fragment: doc.getXmlFragment("document-store"),
        user: {
          name: user.displayName,
          color: user.color,
        }
      }
    });
  }, [documentId]);

  if (editor === undefined) {
    return "Loading content...";
  }

  return <>
    <div className="flex justify-end">
      <label className="flex flex-col justify-center mr-1">
        <i>debug only: Document id: {documentId}</i>
      </label>
      <button
        className="bg-blue-5 hover:bg-blue-6 active:bg-blue-7 c-white"
        onClick={async () => {
          await axios.put(`/documents/${documentId}`, {
            document: {
              content: JSON.stringify(editor.document),
            }
          });
        }}>
        Save
      </button>
    </div>

    <div
      className="min-w-2xl min-h-xl border-dashed"
    >
      <BlockNoteView editor={editor}/>
    </div>

  </>
}

export default Editor;
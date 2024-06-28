import {useMemo} from "react";
import axios from "axios";
import {User} from "../types.ts";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import baseUrl from "../base-url.tsx";

let ydoc: Y.Doc | undefined = undefined;
let acConsumer: ActionCable.Consumer | undefined = undefined;
let acProvider: WebsocketProvider | undefined = undefined;

type EditorProps = {
  initialContent: string, // probably not needed
  user: User,
  documentId: number,
}

const Editor = ({user, documentId}: EditorProps) => {
  const editor = useMemo(() => {
    if (ydoc) {
      ydoc.destroy();
      ydoc = undefined;
    }
    if (acConsumer) {
      acConsumer.disconnect();
      acConsumer = undefined;
    }
    if (acProvider) {
      acProvider.destroy();
      acProvider = undefined;
    }

    if (!documentId) {
      return undefined;
    }

    ydoc = new Y.Doc();
    const websocketBaseUrl = new URL(baseUrl);
    websocketBaseUrl.protocol = websocketBaseUrl.protocol === "http:" ? "ws" : "wss";
    acConsumer = ActionCable.createConsumer(`${websocketBaseUrl.toString().replace(/\/$/, "")}/cable`);
    acProvider = new WebsocketProvider(
      ydoc,
      acConsumer,
      "DocumentChannel",
      {documentId: documentId.toString()},
    );

    return BlockNoteEditor.create({
      // initialContent: JSON.parse(initialContent),
      collaboration: {
        provider: acProvider,
        fragment: ydoc.getXmlFragment("document-store"),
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
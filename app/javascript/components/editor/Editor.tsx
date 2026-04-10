import {useMemo, useState} from "react";
import {Document, User} from "../../types";
import {Block, BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import useInterval from "../../hooks/useInterval"
import schema from "./schema";
import {IndexeddbPersistence} from "y-indexeddb";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import LoadingContent from "./LoadingContent.tsx";
import {CommonSuggestionMenus} from "./CommonSuggestionMenus.tsx";
import {DefaultThreadStoreAuth, ThreadStore, YjsThreadStore} from "@blocknote/core/comments";
import tinySimpleHash from "../../utils/tinySimpleHash";
import resolveUsers from "../../utils/resolveUsers";


let ydoc: Y.Doc | undefined = undefined;
let acConsumer: ActionCable.Consumer | undefined = undefined;
let acProvider: WebsocketProvider | undefined = undefined;
let threadStore: ThreadStore = undefined;

type EditorProps = {
  databaseId: string,
  currentUser: User,
  document: Document,
  editable?: boolean,
  onEditorReady?: (editor: BlockNoteEditor<typeof schema>) => void,
  onConnectionChange?: (isStale: boolean) => void,
  onDocumentChange?: (blocks: Block[]) => void,
}

const Editor = ({currentUser, document, editable = true, databaseId = "", onEditorReady, onConnectionChange, onDocumentChange}: EditorProps) => {
  const [initialStateReceived, setInitialStateReceived] = useState(false);
  const [connectionStale, setConnectionStale] = useState(false);

  useInterval(() => {
    if (window.document.hidden) {
      return; //user is on another tab/window
    }
    //no-ts-inspect
    const isStale = acConsumer?.connection.monitor.connectionIsStale();
    setConnectionStale((prevState) => {
      if (isStale !== prevState) {
        onConnectionChange?.(isStale);
      }
      return isStale;
    });
  }, 1000);

  const editor = useMemo(() => {
    if (threadStore) {
      threadStore = undefined;
    }

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

    if (!document.id) {
      return undefined;
    }

    ydoc = new Y.Doc();
    new IndexeddbPersistence(`databases/${"" + databaseId}/documents/${document.id}`, ydoc);

    const websocketBaseUrl = new URL(window.location.origin);
    websocketBaseUrl.protocol = websocketBaseUrl.protocol === "http:" ? "ws" : "wss";
    acConsumer = ActionCable.createConsumer(`${websocketBaseUrl.toString().replace(/\/$/, "")}/cable`);
    acProvider = new WebsocketProvider(
      ydoc,
      acConsumer,
      "DocumentChannel",
      {documentId: document.id},
    );

    threadStore = new YjsThreadStore(
      currentUser.id.toString(),
      ydoc.getMap("threads"),
      new DefaultThreadStoreAuth(currentUser.id.toString(), editable ? "editor" : "comment"),
    );

    const pseudoRandomFromUserId = (tinySimpleHash(currentUser.id.toString()) + 0x7FFFFFFF) / 0xFFFFFFFF;

    const blockNoteEditor = BlockNoteEditor.create({
      schema,
      comments: {
        threadStore,
      },
      resolveUsers,
      collaboration: {
        provider: acProvider,
        fragment: ydoc.getXmlFragment("document-store"),
        user: {
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          color: `hsl(${~~(360 * pseudoRandomFromUserId)}, 72%,  78%)`,
        },
        showCursorLabels: "always",
      },
      uploadFile: uploadFile(document.id),
      resolveFileUrl: createFileUrlResolver(),
      tables: {
        splitCells: true,
        cellBackgroundColor: true,
        cellTextColor: true,
        headers: true,
      },
    });
    if (onDocumentChange) {
      blockNoteEditor.onChange((editor) => {
        onDocumentChange(editor.document);
      });
    }

    // WebsocketProvider has no .on() — poll the synced getter instead.
    // onEditorReady is called after sync so consumers receive the actual document content,
    // not the empty pre-sync state (important for draft documents with no versions).
    const syncCheck = setInterval(() => {
      if (acProvider.synced) {
        setInitialStateReceived(true);
        onEditorReady?.(blockNoteEditor);
        clearInterval(syncCheck);
      }
    }, 50);

    return blockNoteEditor;
  }, [document.id]);

  if (editor === undefined || !initialStateReceived) {
    return <LoadingContent/>
  }

  return <>
    <BlockNoteView editor={editor} slashMenu={false} sideMenu={false} editable={editable} data-document-editor>
      {/* Replaces the default Slash Menu. */}
      <CommonSuggestionMenus editor={editor}/>
    </BlockNoteView>

  </>
}

export default Editor;
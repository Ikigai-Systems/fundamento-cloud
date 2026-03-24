import {useEffect, useMemo, useState} from "react";
import {Document, User} from "../../types";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import useInterval from "../../hooks/useInterval"
import schema from "./schema";
import {IndexeddbPersistence} from "y-indexeddb";
import createFlash from "../../utils/createFlash.ts"
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
}

const Editor = ({currentUser, document, editable = true, databaseId = ""}: EditorProps) => {
  const [initialStateReceived, setInitialStateReceived] = useState(false);
  const [connectionStale, setConnestionStale] = useState(false);

  useInterval(() => {
    if (window.document.hidden) {
      return; //user is on another tab/window
    }
    //no-ts-inspect
    const isStale = acConsumer?.connection.monitor.connectionIsStale();
    setConnestionStale((prevState) => {
      if (isStale !== prevState) {
        createFlash({
          message: isStale ? "Disconnected from the server. Your changes are stored only locally." : "Connection to server restored.",
          type: isStale ? "error" : "notice",
          replacePrevious: true,
          key: `isStaleMessage`,
          duration: isStale ? undefined : "short",
        });
      }
      return isStale;
    })
  }, 1000);

  useEffect(() => {
    const editorConnectionIndicatorDiv = window.document.querySelector("#editor-connection-indicator");
    if (connectionStale) {
      editorConnectionIndicatorDiv.innerHTML = '<div class="font-semibold text-slate-400">Offline</div>\n';
    } else {
      editorConnectionIndicatorDiv.innerHTML = '';
    }
  }, [connectionStale]);

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

    // hackery to determine if editor has been initialized with initial content from the action cable or not yet
    const subscription = acConsumer.subscriptions.subscriptions[0];
    const originalReceived = subscription.received;
    subscription._messagesReceived = 0;
    subscription.received = (message) => {
      subscription._messagesReceived++;
      if (subscription._messagesReceived == 2) {
        setInitialStateReceived(true);
      }
      return originalReceived(message);
    }

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
    blockNoteEditor.onChange((editor) => {
      const block = editor.getTextCursorPosition().block;
      if (block.type !== 'paragraph') {
        return;
      }
      const currentBlockText = block?.content[0]?.["text"];
      // if (currentBlockText === '```') {
      //   editor.updateBlock(block, {type: "procode"} as PartialBlock);
      //   editor.setTextCursorPosition(block);
      // }
    });

    window.blockNoteEditor = blockNoteEditor; // for .erb button_to hacks to work (see app/views/documents/edit.html.erb#save_this_as_version) + for displaying document Structure in right sidebar
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
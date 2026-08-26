import {useEffect, useRef, useState} from "react";
import {Document, User} from "../../types";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import {cable} from "@hotwired/turbo-rails";
import useInterval from "../../hooks/useInterval"
import schema from "./schema";
import {IndexeddbPersistence} from "y-indexeddb";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import LoadingContent from "./LoadingContent.tsx";
import {CommonSuggestionMenus} from "./CommonSuggestionMenus.tsx";
import {DefaultThreadStoreAuth} from "@blocknote/core/comments";
import {YjsThreadStore, withCollaboration} from "@blocknote/core/yjs";
import tinySimpleHash from "../../utils/tinySimpleHash";
import resolveUsers from "../../utils/resolveUsers";

// The @types/rails__actioncable definitions omit `connectionIsStale`, which exists at runtime
// (see @rails/actioncable ConnectionMonitor). Augment the type so we can call it type-safely.
declare module "@rails/actioncable" {
  // The type parameter must match the original class declaration exactly for merging to apply.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ConnectionMonitor<C = Consumer> {
    connectionIsStale(): boolean;
  }
}

type EditorInstance = typeof schema.BlockNoteEditor;
type EditorBlock = typeof schema.Block;

type EditorProps = {
  databaseId: string,
  currentUser: User,
  document: Document,
  editable?: boolean,
  onEditorReady?: (editor: EditorInstance) => void,
  onConnectionChange?: (isStale: boolean) => void,
  onDocumentChange?: (blocks: EditorBlock[]) => void,
}

const Editor = ({currentUser, document, editable = true, databaseId = "", onEditorReady, onConnectionChange, onDocumentChange}: EditorProps) => {
  const [editor, setEditor] = useState<EditorInstance | undefined>(undefined);
  const [initialStateReceived, setInitialStateReceived] = useState(false);
  const [, setConnectionStale] = useState(false);

  // Per-instance, not module-level: two Editor lifecycles (e.g. a fast unmount
  // racing a remount) must never share or clobber each other's connection.
  const acConsumerRef = useRef<ActionCable.Consumer | undefined>(undefined);

  useInterval(() => {
    if (window.document.hidden) {
      return; //user is on another tab/window
    }
    const isStale = acConsumerRef.current?.connection.monitor.connectionIsStale() ?? false;
    setConnectionStale((prevState) => {
      if (isStale !== prevState) {
        onConnectionChange?.(isStale);
      }
      return isStale;
    });
  }, 1000);

  // Creation lives in useEffect (not useMemo) so teardown is tied to React's
  // actual unmount/dependency-change signal via the returned cleanup function,
  // instead of happening as a side effect of the *next* Editor's creation —
  // previously the ActionCable connection was never explicitly closed on
  // unmount, it just leaked until something else happened to replace it.
  useEffect(() => {
    setInitialStateReceived(false);
    setEditor(undefined);

    if (!document.id) {
      return;
    }

    // Reuse Turbo's own shared ActionCable consumer (also used by e.g. the
    // OnlineUsersChannel turbo_stream_from in the page layout) instead of
    // opening a second, redundant WebSocket connection per editor. A single
    // consumer multiplexes any number of channel subscriptions fine — this
    // is the same connection Turbo already keeps open, just reused, not a
    // separate one. getConsumer() resolves immediately if Turbo already
    // connected it (the common case), so this rarely adds real latency.
    let cancelled = false;
    let ydoc: Y.Doc | undefined;
    let acProvider: WebsocketProvider | undefined;
    let syncCheck: ReturnType<typeof setInterval> | undefined;

    cable.getConsumer().then((acConsumer: ActionCable.Consumer) => {
      if (cancelled) {
        return;
      }

      acConsumerRef.current = acConsumer;

      ydoc = new Y.Doc();
      new IndexeddbPersistence(`databases/${"" + databaseId}/documents/${document.id}`, ydoc);

      acProvider = new WebsocketProvider(
        ydoc,
        acConsumer,
        "DocumentChannel",
        {documentId: document.id},
      );

      const threadStore = new YjsThreadStore(
        currentUser.id.toString(),
        ydoc.getMap("threads"),
        new DefaultThreadStoreAuth(currentUser.id.toString(), editable ? "editor" : "comment"),
      );

      const pseudoRandomFromUserId = (tinySimpleHash(currentUser.id.toString()) + 0x7FFFFFFF) / 0xFFFFFFFF;

      // @blocknote/core 0.52 no longer wires up collaboration from the plain
      // `collaboration` option passed to BlockNoteEditor.create — the options must
      // be run through `withCollaboration` (from @blocknote/core/yjs) to register
      // the ySync extension. Without it, edits never reach the shared Y.Doc.
      const blockNoteEditor = BlockNoteEditor.create(withCollaboration({
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
      }));
      if (onDocumentChange) {
        blockNoteEditor.onChange((editor) => {
          onDocumentChange(editor.document);
        });
      }
      setEditor(blockNoteEditor);

      // WebsocketProvider has no .on() — poll the synced getter instead.
      // onEditorReady is called after sync so consumers receive the actual document content,
      // not the empty pre-sync state (important for draft documents with no versions).
      syncCheck = setInterval(() => {
        if (acProvider?.synced) {
          setInitialStateReceived(true);
          onEditorReady?.(blockNoteEditor);
          clearInterval(syncCheck);
        }
      }, 50);
    });

    return () => {
      cancelled = true;
      if (syncCheck) {
        clearInterval(syncCheck);
      }
      acConsumerRef.current = undefined;
      ydoc?.destroy();
      // Only unsubscribe this editor's own channel — acConsumer is Turbo's
      // shared connection, used elsewhere on the page, and must never be
      // disconnected here.
      acProvider?.destroy();
    };
    // Editor is intentionally recreated only when the document changes; other props are read once at creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
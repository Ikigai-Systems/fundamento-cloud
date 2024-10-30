import {useEffect, useMemo, useState} from "react";
import {User} from "../../types";
import {BlockNoteEditor, filterSuggestionItems, PartialBlock} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import useInterval from "../../hooks/useInterval"
import {
  BlockColorsItem,
  DragHandleMenu,
  FormattingToolbar,
  getDefaultReactSlashMenuItems,
  RemoveBlockItem,
  SideMenu,
  SideMenuController,
  SuggestionMenuController,
  useSelectedBlocks,
} from "@blocknote/react";
import schema from "./schema";
import {getMentionMenuItems} from "./inline-content/mention-menu-items";
import AdvancedTableMenuItem from "./blocks/AdvancedTableMenuItem.tsx";
import {IndexeddbPersistence} from "y-indexeddb";
import createFlash from "../createFlash.ts"
import "./editor-styles.css";
import CodeBlockMenuItem from "./blocks/CodeBlockMenuItem.tsx";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import TurnIntoItem from "./drag-handle/TurnIntoItem.tsx";

let ydoc: Y.Doc | undefined = undefined;
let acConsumer: ActionCable.Consumer | undefined = undefined;
let acProvider: WebsocketProvider | undefined = undefined;

const tinySimpleHash = (s: string) => {
  let h = 9;
  for (let i = 0; i < s.length;) {
    h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
  }
  return h ^ h >>> 9
}

type EditorProps = {
  currentUser: User,
  documentId: number,
  editable?: boolean,
}

const LoadingContent = () => {
  return <div className="pl-[3.4rem] pb-1 mt-5 flex gap-2">
    <span className="animate-spin size-5 icon-[heroicons--arrow-path]"></span>
    Loading content...
  </div>;
}

const Editor = ({currentUser, documentId, editable = true}: EditorProps) => {
  const [initialStateReceived, setInitialStateReceived] = useState(false);
  const [connectionStale, setConnestionStale] = useState(false);

  useInterval(() => {
    if (document.hidden) {
      return; //user is on another tab/window
    }
    //no-ts-inspect
    const isStale = acConsumer?.connection.monitor.connectionIsStale();
    setConnestionStale((prevState) => {
      if (isStale !== prevState) {
        createFlash({
          message: isStale ? "Disconnected from the server. Your changes are stored only locally." : "Connection to server restored.",
          type: isStale ? "error" : "success"
        });
      }
      return isStale;
    })
  }, 1000);

  useEffect(() => {
    const editorConnectionIndicatorDiv = document.querySelector("#editor-connection-indicator");
    if (connectionStale) {
      editorConnectionIndicatorDiv.innerHTML = '<div class="font-semibold text-slate-400">Offline</div>\n';
    } else {
      editorConnectionIndicatorDiv.innerHTML = '';
    }
  }, [connectionStale]);

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
    new IndexeddbPersistence("document:" + documentId.toString(), ydoc);

    const websocketBaseUrl = new URL(window.location.origin);
    websocketBaseUrl.protocol = websocketBaseUrl.protocol === "http:" ? "ws" : "wss";
    acConsumer = ActionCable.createConsumer(`${websocketBaseUrl.toString().replace(/\/$/, "")}/cable`);
    acProvider = new WebsocketProvider(
      ydoc,
      acConsumer,
      "DocumentChannel",
      {documentId: documentId.toString()},
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

    const pseudoRandomFromUserId = (tinySimpleHash(currentUser.id.toString()) + 0x7FFFFFFF) / 0xFFFFFFFF;

    const blockNoteEditor = BlockNoteEditor.create({
      schema,
      collaboration: {
        provider: acProvider,
        fragment: ydoc.getXmlFragment("document-store"),
        user: {
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          color: `hsl(${~~(360 * pseudoRandomFromUserId)}, 72%,  78%)`,
        }
      },
      uploadFile: uploadFile(documentId),
      resolveFileUrl: createFileUrlResolver(),
    });
    blockNoteEditor.onChange((editor) => {
      const block = editor.getTextCursorPosition().block;
      if (block.type !== 'paragraph') {
        return;
      }
      const currentBlockText = block?.content[0]?.["text"];
      if (currentBlockText === '```') {
        editor.updateBlock(block, {type: "procode"} as PartialBlock);
      }
    });

    window.blockNoteEditor = blockNoteEditor; // for .erb button_to hacks to work (see app/views/documents/edit.html.erb#save_this_as_version)
    return blockNoteEditor;
  }, [documentId]);

  const selectedBlocks = useSelectedBlocks(editor);

  if (editor === undefined || !initialStateReceived) {
    return <LoadingContent/>
  }

  return <>
    <BlockNoteView editor={editor} slashMenu={false} sideMenu={false} /*formattingToolbar={false}*/ editable={editable}>
      {/* Replaces the default Slash Menu. */}
      <SuggestionMenuController
        triggerCharacter={"/"}
        getItems={async (query) => {
          // Gets all default slash menu items and `insertAlert` item.
          let defaultTableMenuItem = undefined;
          const itemsWithoutTable = getDefaultReactSlashMenuItems(editor).filter(defaultMenuItem => {
            if (defaultMenuItem.key === 'table') {
              defaultTableMenuItem = defaultMenuItem;
              return false;
            } else {
              return true;
            }
          });
          defaultTableMenuItem.title = "Grid table";
          defaultTableMenuItem.subtext = "Simple rows and columns formatting";

          return filterSuggestionItems(
            [...itemsWithoutTable, defaultTableMenuItem, AdvancedTableMenuItem(), CodeBlockMenuItem()],
            query
          )
        }}
      />
      <SuggestionMenuController
        // Gets the mentions menu items
        triggerCharacter={"@"}
        getItems={async (query) =>
          filterSuggestionItems(await getMentionMenuItems(), query)
        }
      />
      <SideMenuController
        sideMenu={(props) => (
          <SideMenu {...props}
            dragHandleMenu={(props) => (
              <DragHandleMenu {...props}>
                <TurnIntoItem {...props}>Turn into</TurnIntoItem>
                <RemoveBlockItem {...props}>Delete</RemoveBlockItem>
                <BlockColorsItem {...props}>Colors</BlockColorsItem>
              </DragHandleMenu>
            )}
          />
        )}
      />
      <div className="ikigai-static-toolbar-overrides">
        {editable && selectedBlocks.length > 0 && <FormattingToolbar />}
      </div>
    </BlockNoteView>
  </>
}

export default Editor;
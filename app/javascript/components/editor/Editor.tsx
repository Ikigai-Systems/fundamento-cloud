import {useMemo} from "react";
import {User} from "../../types";
import {BlockNoteEditor, filterSuggestionItems} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import {getDefaultReactSlashMenuItems, SuggestionMenuController} from "@blocknote/react";
import schema from "./schema";
import {getMentionMenuItems} from "./inline-content/mention-menu-items";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import AttachmentsApi from "~/api/AttachmentsApi.js";
import {request} from '@js-from-routes/axios';
import DatabaseMenuItem from "./blocks/DatabaseMenuItem.tsx";
import "./editor-styles.css";

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
  initialContent: string, // probably not needed
  currentUser: User,
  documentId: number,
}

const Editor = ({currentUser, documentId}: EditorProps) => {
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
    const websocketBaseUrl = new URL(window.location.origin);
    websocketBaseUrl.protocol = websocketBaseUrl.protocol === "http:" ? "ws" : "wss";
    acConsumer = ActionCable.createConsumer(`${websocketBaseUrl.toString().replace(/\/$/, "")}/cable`);
    acProvider = new WebsocketProvider(
      ydoc,
      acConsumer,
      "DocumentChannel",
      {documentId: documentId.toString()},
    );

    const pseudoRandomFromUserId = (tinySimpleHash(currentUser.id.toString()) + 0x7FFFFFFF) / 0xFFFFFFFF;

    return BlockNoteEditor.create({
      schema,
      // initialContent: JSON.parse(initialContent),
      collaboration: {
        provider: acProvider,
        fragment: ydoc.getXmlFragment("document-store"),
        user: {
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          color: `hsl(${~~(360 * pseudoRandomFromUserId)}, 72%,  78%)`,
        }
      },
      uploadFile: async (file) => {
        const body = new FormData();
        body.append("file", file);

        const attachment = await request("post", AttachmentsApi.create.path(), {data: body, responseAs: "json", headers: {
          'Content-Type': 'multipart/form-data'
        }});

        return attachment.location;
      },
    });
  }, [documentId]);

  if (editor === undefined) {
    return "Loading content...";
  }

  return <>
    {/*<div className="flex justify-end">*/}
    {/*  <label className="flex flex-col justify-center mr-1">*/}
    {/*    <i>debug only: Document id: {documentId}</i>*/}
    {/*  </label>*/}
    {/*</div>*/}

    <div
      className="min-w-2xl min-h-xl border-dashed"
    >
      <BlockNoteView editor={editor} slashMenu={false}>
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
            defaultTableMenuItem.title = "Simple table";
            defaultTableMenuItem.subtext = "Used for formatting content into rows/columns";

            return filterSuggestionItems(
              [...itemsWithoutTable, defaultTableMenuItem, DatabaseMenuItem(editor)],
              query
            )
          }}
        />
        <SuggestionMenuController
          // Gets the mentions menu items
          triggerCharacter={"@"}
          getItems={async (query) =>
            filterSuggestionItems(await getMentionMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>

  </>
}

export default Editor;
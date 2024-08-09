import {useEffect, useMemo, useState} from "react";
import {User} from "../../types";
import {BlockNoteEditor, filterSuggestionItems} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import {cable} from "@hotwired/turbo-rails";
import {getDefaultReactSlashMenuItems, SuggestionMenuController} from "@blocknote/react";
import schema from "./schema";
import {getMentionMenuItems} from "./inline-content/mention-menu-items";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import AttachmentsApi from "~/api/AttachmentsApi.js";
import {request} from '@js-from-routes/axios';
import DatabaseMenuItem from "./blocks/DatabaseMenuItem.tsx";
import "./editor-styles.css";

let ydoc: Y.Doc | undefined = undefined;
let acProvider: WebsocketProvider | undefined = undefined;

type EditorProps = {
  initialContent: string, // probably not needed
  user: User,
  documentId: number,
}

const Editor = ({user, documentId}: EditorProps) => {
  const [actionCableConsumer, setActionCableConsumer] = useState(null);

  useEffect(() => {
    cable.getConsumer().then(setActionCableConsumer);
  }, []);

  const editor = useMemo(() => {
    console.log("useMemo", documentId, actionCableConsumer); // FIXME

    if (ydoc) {
      ydoc.destroy();
      ydoc = undefined;
    }
    if (actionCableConsumer) {
      actionCableConsumer.disconnect();
      // setActionCableConsumer(null);
    }
    if (acProvider) {
      acProvider.destroy();
      acProvider = undefined;
    }

    if (!documentId || !actionCableConsumer) {
      return undefined;
    }

    ydoc = new Y.Doc();
    const websocketBaseUrl = new URL(window.location.origin);
    websocketBaseUrl.protocol = websocketBaseUrl.protocol === "http:" ? "ws" : "wss";

    console.log("Moving forward", actionCableConsumer); // FIXME

    acProvider = new WebsocketProvider(
      ydoc,
      actionCableConsumer,
      "DocumentChannel",
      {documentId: documentId.toString()},
    );

    return BlockNoteEditor.create({
      schema,
      // initialContent: JSON.parse(initialContent),
      collaboration: {
        provider: acProvider,
        fragment: ydoc.getXmlFragment("document-store"),
        user: {
          name: user.displayName,
          color: user.color,
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
  }, [documentId, actionCableConsumer]);

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
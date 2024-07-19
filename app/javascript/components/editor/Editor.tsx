import {useMemo} from "react";
import axios from "axios";
import {User} from "../../types";
import {BlockNoteEditor, BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import * as Y from "yjs";
import {WebsocketProvider} from "@y-rb/actioncable";
import * as ActionCable from "@rails/actioncable";
import {getMentionMenuItems, Mention} from "./inline-content/Mention";
import {SuggestionMenuController} from "@blocknote/react";

let ydoc: Y.Doc | undefined = undefined;
let acConsumer: ActionCable.Consumer | undefined = undefined;
let acProvider: WebsocketProvider | undefined = undefined;


// Our schema with inline content specs, which contain the configs and
// implementations for inline content  that we want our editor to use.
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    // Adds all default inline content.
    ...defaultInlineContentSpecs,
    // Adds the mention tag.
    mention: Mention,
  },
});

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
    const websocketBaseUrl = new URL(window.location.origin);
    websocketBaseUrl.protocol = websocketBaseUrl.protocol === "http:" ? "ws" : "wss";
    acConsumer = ActionCable.createConsumer(`${websocketBaseUrl.toString().replace(/\/$/, "")}/cable`);
    acProvider = new WebsocketProvider(
      ydoc,
      acConsumer,
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

        const response = await axios.post("/api/v1/attachments", body, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        return response.data.location;
      },
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
        style={{display: "none"}}
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
      <BlockNoteView editor={editor}>
        <SuggestionMenuController
          // Gets the mentions menu items
          triggerCharacter={"@"}
          getItems={async (query) =>
            filterSuggestionItems(getMentionMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>

  </>
}

export default Editor;
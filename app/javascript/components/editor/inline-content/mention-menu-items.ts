import schema from "../schema";
import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document, User} from "../../../types.ts";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";

export const getMentionMenuItems = async (
  editor: typeof schema.BlockNoteEditor
): Promise<DefaultReactSuggestionItem[]> => {
  const [documents, users] = await Promise.all([DocumentsApi.index(), UsersApi.index()]);

  return documents.map((document: Document) => ({
    title: document.title,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            title: document.title,
            id: document.id,
            entity: "document",
          },
        },
        " ", // add a space after the mention
      ]);
    },
  })).concat(users.map((user: User) => ({
    title: `${user.firstName} ${user.lastName}`,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            title: `${user.firstName} ${user.lastName}`,
            id: user.id,
            entity: "user",
          }
        }
      ])
    }
  })));
};
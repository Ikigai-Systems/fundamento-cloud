import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document, User} from "../../../types.ts";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";

export const getMentionMenuItems = async (): Promise<DefaultReactSuggestionItem[]> => {
  const [documents, users] = await Promise.all([DocumentsApi.index(), UsersApi.index()]);

  return documents.map((document: Document) => ({
    title: document.title,
    onItemClick: (editor) => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            id: crypto.randomUUID(),
            entity: "document",
            entityId: document.id,
          },
        },
        " ", // add a space after the mention
      ]);
    },
  })).concat(users.map((user: User) => ({
    title: `${user.firstName} ${user.lastName}`,
    onItemClick: (editor) => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            id: crypto.randomUUID(),
            entity: "user",
            entityId: user.id,
          }
        }
      ])
    }
  })));
};
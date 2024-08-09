import schema from "../schema";
import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document, User} from "../../../types.ts";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import DocumentsApi from "~/api/DocumentsApi";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import UsersApi from "~/api/UsersApi";

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
import schema from "../schema";
import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document} from "../../../types.ts";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import DocumentsApi from "~/api/DocumentsApi"

export const getMentionMenuItems = async (
  editor: typeof schema.BlockNoteEditor
): Promise<DefaultReactSuggestionItem[]> => {
  const documents = await DocumentsApi.index();

  return documents.map((document: Document) => ({
    title: document.title,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            title: document.title,
            id: document.id,
          },
        },
        " ", // add a space after the mention
      ]);
    },
  }));
};
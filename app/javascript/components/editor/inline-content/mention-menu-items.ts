import schema from "../schema";
import {DefaultReactSuggestionItem} from "@blocknote/react";
import axios from "axios";
import {Document} from "../../../types.ts";

export const getMentionMenuItems = async (
  editor: typeof schema.BlockNoteEditor
): Promise<DefaultReactSuggestionItem[]> => {
  const response = await axios.get("/documents.json");

  return response.data.map((document: Document) => ({
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
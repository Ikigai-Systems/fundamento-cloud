// Slash menu item to insert an Alert block
import {insertOrUpdateBlock} from "@blocknote/core";
import schema from "../schema.ts";

const AlertMenuItem = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Alert",
  subtext: "Inserts panel-like alert to highlight specific document part",
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: "alert",
    });
  },
  aliases: [
    "alert",
    "notification",
    "emphasize",
    "warning",
    "error",
    "info",
    "success",
  ],
  group: "Other",
  icon: <span className="relative top-0.5"><span className="size-4 icon-[heroicons--megaphone]"></span></span>,
});

export default AlertMenuItem;
import schema from "../schema.ts";
import {SlashMenuIcon} from "../SlashMenuIcon.tsx";

const ButtonInlineContentMenuItem = () => ({
  title: "Formula",
  subtext: "Display result of the custom calculation",
  onItemClick: (editor: typeof schema.BlockNoteEditor) => {
    editor.insertInlineContent([{
      type: "formula"
    }]);
  },
  aliases: [
    "function",
    "calculation",
  ],
  group: "Advanced",
  icon: <SlashMenuIcon icon="icon-[tabler--sum]"/>,
});

export default ButtonInlineContentMenuItem;
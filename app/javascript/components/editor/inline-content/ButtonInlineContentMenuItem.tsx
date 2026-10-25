import schema from "../schema.ts";
import {SlashMenuIcon} from "../SlashMenuIcon.tsx";

const ButtonInlineContentMenuItem = () => ({
  title: "Button",
  subtext: "Add custom interactions to your document with the click of a button",
  onItemClick: (editor: typeof schema.BlockNoteEditor) => {
    editor.insertInlineContent([{
      type: "button"
    }]);
  },
  aliases: [
    "action",
    "interaction",
  ],
  group: "Advanced",
  icon: <SlashMenuIcon icon="icon-[tabler--bolt]"/>,
});

export default ButtonInlineContentMenuItem;
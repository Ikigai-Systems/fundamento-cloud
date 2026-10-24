import schema from "../schema.ts";
import {SlashMenuIcon} from "../SlashMenuIcon.tsx";

const CodeBlockMenuItem = () => ({
  title: "Code",
  subtext: "Section containing multi-line code",
  onItemClick: (editor: typeof schema.BlockNoteEditor) => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks([{
      type: "procode",
    }], currentBlock, "after");
    const nextBlock = editor.getTextCursorPosition().nextBlock;
    if (nextBlock) {
      editor.setTextCursorPosition(nextBlock, "start");
    }
  },
  aliases: [
    "code",
  ],
  group: "Advanced",
  icon: <SlashMenuIcon icon="icon-[tabler--code]"/>,
});

export default CodeBlockMenuItem;
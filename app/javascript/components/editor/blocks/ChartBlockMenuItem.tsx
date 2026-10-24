// Slash menu item to insert a Chart block

import schema from "../schema.ts";
import {SlashMenuIcon} from "../SlashMenuIcon.tsx";

const ChartBlockMenuItem = () => ({
  title: "Chart",
  subtext: "Visualize your data in a combination of different charts",
  onItemClick: (editor: typeof schema.BlockNoteEditor) => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks([{
      type: "chartBlock",
    }], currentBlock, "after");
    const nextBlock = editor.getTextCursorPosition().nextBlock;
    if (nextBlock) {
      editor.setTextCursorPosition(nextBlock, "start");
    }
  },
  aliases: [
    "piechart",
    "barchart",
  ],
  group: "Advanced",
  icon: <SlashMenuIcon icon="icon-[tabler--chart-pie]"/>,
});

export default ChartBlockMenuItem;
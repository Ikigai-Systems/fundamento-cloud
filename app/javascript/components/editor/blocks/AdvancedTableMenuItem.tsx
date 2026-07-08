// Slash menu item to insert an Advanced table block

import schema from "../schema.ts";

const AdvancedTableMenuItem = () => ({
  title: "Advanced table",
  subtext: "Store and reference data in a structured way",
  onItemClick: (editor: typeof schema.BlockNoteEditor) => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks([{
      type: "advancedTable",
    }], currentBlock, "after");
    const nextBlock = editor.getTextCursorPosition().nextBlock;
    if (nextBlock) {
      editor.setTextCursorPosition(nextBlock, "start");
    }
  },
  aliases: [
    "database",
    "table",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--table-cells]"></span></span>,
});

export default AdvancedTableMenuItem;
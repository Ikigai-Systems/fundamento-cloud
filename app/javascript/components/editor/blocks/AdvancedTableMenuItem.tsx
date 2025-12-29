// Slash menu item to insert an Advanced table block

const AdvancedTableMenuItem = () => ({
  title: "Advanced table",
  subtext: "Store and reference data in a structured way",
  onItemClick: (editor) => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks([{
      type: "advancedTable",
    }], currentBlock, "after");
    editor.setTextCursorPosition(editor.getTextCursorPosition().nextBlock, "start");
  },
  aliases: [
    "database",
    "table",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--table-cells]"></span></span>,
});

export default AdvancedTableMenuItem;
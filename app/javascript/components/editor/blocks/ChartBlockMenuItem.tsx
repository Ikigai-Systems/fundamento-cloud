// Slash menu item to insert a Chart block

const ChartBlockMenuItem = () => ({
  title: "Chart",
  subtext: "Visualize your data in a combination of different charts",
  onItemClick: (editor) => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks([{
      type: "chartBlock",
    }], currentBlock, "after");
    editor.setTextCursorPosition(editor.getTextCursorPosition().nextBlock, "start");
  },
  aliases: [
    "piechart",
    "barchart",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--chart-pie]"></span></span>,
});

export default ChartBlockMenuItem;
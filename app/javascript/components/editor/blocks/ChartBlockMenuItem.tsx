// Slash menu item to insert an Alert block
import {insertOrUpdateBlock} from "@blocknote/core";

const ChartBlockMenuItem = () => ({
  title: "Chart",
  subtext: "Visualize your data in a combination of different charts",
  onItemClick: (editor) => {
    insertOrUpdateBlock(editor, {
      type: "chartBlock",
    });
  },
  aliases: [
    "piechart",
    "barchart",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--chart-pie]"></span></span>,
});

export default ChartBlockMenuItem;
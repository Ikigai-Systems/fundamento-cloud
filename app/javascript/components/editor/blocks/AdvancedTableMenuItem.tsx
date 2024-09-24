// Slash menu item to insert an Alert block
import {insertOrUpdateBlock} from "@blocknote/core";

const AdvancedTableMenuItem = () => ({
  title: "Advanced table",
  subtext: "Store and reference data in a structured way",
  onItemClick: (editor) => {
    insertOrUpdateBlock(editor, {
      type: "advancedTable",
    });
  },
  aliases: [
    "database",
    "table",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--table-cells]"></span></span>,
});

export default AdvancedTableMenuItem;
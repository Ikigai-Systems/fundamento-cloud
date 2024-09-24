// Slash menu item to insert an Alert block
import {insertOrUpdateBlock} from "@blocknote/core";

const DatabaseMenuItem = () => ({
  title: "Database",
  subtext: "Used for storing and referencing data in a structured way",
  onItemClick: (editor) => {
    insertOrUpdateBlock(editor, {
      type: "database",
    });
  },
  aliases: [
    "database",
    "table",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--table-cells]"></span></span>,
});

export default DatabaseMenuItem;
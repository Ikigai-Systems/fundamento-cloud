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
  icon: <span className="relative top-0.5"><span className="size-4 icon-[heroicons--table-cells]"></span></span>,
});

export default DatabaseMenuItem;
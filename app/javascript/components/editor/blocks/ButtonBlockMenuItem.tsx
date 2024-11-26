// Slash menu item to insert an Alert block
import {insertOrUpdateBlock} from "@blocknote/core";

const ButtonBlockMenuItem = () => ({
  title: "Button",
  subtext: "Add custom interactions to your doc with the click of a button",
  onItemClick: (editor) => {
    insertOrUpdateBlock(editor, {
      type: "button",
    });
  },
  // aliases: [
  //   "database",
  //   "table",
  // ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--bolt]"></span></span>,
});

export default ButtonBlockMenuItem;
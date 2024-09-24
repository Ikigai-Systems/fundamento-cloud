import {insertOrUpdateBlock} from "@blocknote/core";

const CodeBlockMenuItem = () => ({
  title: "Code",
  subtext: "Section containing multi-line code",
  onItemClick: (editor) => {
    insertOrUpdateBlock(editor, {
      type: "procode",
    });
  },
  aliases: [
    "code",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-6px_-3px]"><span className="size-6 icon-[heroicons--code-bracket-square]"></span></span>,
});

export default CodeBlockMenuItem;
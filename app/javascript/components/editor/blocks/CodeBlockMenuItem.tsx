import schema from "../schema.ts";

const CodeBlockMenuItem = () => ({
  title: "Code",
  subtext: "Section containing multi-line code",
  onItemClick: (editor: typeof schema.BlockNoteEditor) => {
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks([{
      type: "procode",
    }], currentBlock, "after");
    const nextBlock = editor.getTextCursorPosition().nextBlock;
    if (nextBlock) {
      editor.setTextCursorPosition(nextBlock, "start");
    }
  },
  aliases: [
    "code",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-6px_-3px]"><span className="size-6 icon-[heroicons--code-bracket-square]"></span></span>,
});

export default CodeBlockMenuItem;
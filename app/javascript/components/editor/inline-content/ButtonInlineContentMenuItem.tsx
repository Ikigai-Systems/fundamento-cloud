const ButtonInlineContentMenuItem = () => ({
  title: "Button",
  subtext: "Add custom interactions to your document with the click of a button",
  onItemClick: (editor) => {
    editor.insertInlineContent([{
      type: "button"
    }]);
  },
  aliases: [
    "action",
    "interaction",
  ],
  group: "Advanced",
  icon: <span className="relative top-[3px] m-[-4px_-1px]"><span className="size-5 icon-[heroicons--bolt]"></span></span>,
});

export default ButtonInlineContentMenuItem;
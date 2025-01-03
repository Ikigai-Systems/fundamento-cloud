const ButtonInlineContentMenuItem = () => ({
  title: "Formula",
  subtext: "Display result of the custom calculation",
  onItemClick: (editor) => {
    editor.insertInlineContent([{
      type: "formula"
    }]);
  },
  aliases: [
    "function",
    "calculation",
  ],
  group: "Advanced",
  icon: <span className="size-4 m-px relative left-0.5 text-base fa-regular fa-sigma"></span>,
});

export default ButtonInlineContentMenuItem;
import {insertOrUpdateBlock} from "@blocknote/core";

const BlockQuoteMenuItem = () => ({
	title: "Block quote",
	subtext: "Extended quotation",
	onItemClick: (editor) => {
		insertOrUpdateBlock(editor, {
			type: "blockQuote",
		});
	},
	aliases: [
		"blockQuote",
		"quote"
	],
	group: "Advanced",
	icon: <span className="relative top-[3px] m-[-6px_-3px]"><span className="size-6 icon-[heroicons--bars-3]"></span></span>,
});


export default BlockQuoteMenuItem;

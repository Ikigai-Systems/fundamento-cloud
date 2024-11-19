import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import BlockQuote from './blocks/BlockQuote.tsx';
import Mention from "./inline-content/Mention";
import AdvancedTable from "./blocks/AdvancedTable.tsx";
import CodeBlock from "./blocks/CodeBlock";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content that we want our editor to use.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const {codeBlock, ...remainingBlockSpecs} = defaultBlockSpecs
const {...remainingBlockSpecs} = defaultBlockSpecs

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
  blockSpecs: {
    ...remainingBlockSpecs,
    advancedTable: AdvancedTable,
		blockQuote: BlockQuote,
    procode: CodeBlock,
  }
});

export default schema;

import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import Mention from "./inline-content/Mention";
import AdvancedTable from "./blocks/AdvancedTable.tsx";
import CodeBlock from "./blocks/CodeBlock.tsx";
import ButtonBlock from "./blocks/ButtonBlock.tsx";
import ButtonInlineContent from "./inline-content/ButtonInlineContent.tsx";
import ChartBlock from "./blocks/ChartBlock.tsx";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content that we want our editor to use.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const {codeBlock, ...remainingBlockSpecs} = defaultBlockSpecs
const {...remainingBlockSpecs} = defaultBlockSpecs

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
    button: ButtonInlineContent,
  },
  blockSpecs: {
    ...remainingBlockSpecs,
    advancedTable: AdvancedTable,
    chartBlock: ChartBlock,
    procode: CodeBlock, // <-- to be deprecated and removed at some point
  }
});

export default schema;

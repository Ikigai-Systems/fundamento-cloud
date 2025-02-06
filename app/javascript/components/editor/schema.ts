import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import MentionInlineContent from "./inline-content/MentionInlineContent.tsx";
import AdvancedTable from "./blocks/AdvancedTable.tsx";
import CodeBlock from "./blocks/CodeBlock.tsx";
import ButtonInlineContent from "./inline-content/ButtonInlineContent.tsx";
import FormulaInlineContent from "./inline-content/FormulaInlineContent.tsx";
import ChartBlock from "./blocks/ChartBlock.tsx";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content that we want our editor to use.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const {codeBlock, ...remainingBlockSpecs} = defaultBlockSpecs
const {...remainingBlockSpecs} = defaultBlockSpecs

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: MentionInlineContent,
    button: ButtonInlineContent,
    formula: FormulaInlineContent,
  },
  blockSpecs: {
    ...remainingBlockSpecs,
    advancedTable: AdvancedTable,
    chartBlock: ChartBlock,
    procode: CodeBlock, // <-- to be deprecated and removed at some point
  }
});

export default schema;

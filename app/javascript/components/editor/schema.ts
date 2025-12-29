import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import MentionInlineContent from "./inline-content/MentionInlineContent.tsx";
import {createAdvancedTable} from "./blocks/AdvancedTable.tsx";
import {createCodeBlock} from "./blocks/CodeBlock.tsx";
import ButtonInlineContent from "./inline-content/ButtonInlineContent.tsx";
import FormulaInlineContent from "./inline-content/FormulaInlineContent.tsx";
import {createChartBlock} from "./blocks/ChartBlock.tsx";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content that we want our editor to use.

 
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
    advancedTable: createAdvancedTable(),
    chartBlock: createChartBlock(),
    procode: createCodeBlock(), // <-- to be deprecated and removed at some point
  }
});

export default schema;

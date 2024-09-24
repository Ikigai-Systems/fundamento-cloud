import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import Mention from "./inline-content/Mention";
import AdvancedTable from "./blocks/AdvancedTable.tsx";
import CodeBlock from "./blocks/CodeBlock";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content that we want our editor to use.
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    advancedTable: AdvancedTable,
    procode: CodeBlock,
  }
});

export default schema;

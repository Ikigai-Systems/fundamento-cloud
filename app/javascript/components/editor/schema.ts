import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import Mention from "./inline-content/Mention";
import Database from "./blocks/Database.tsx";
import {CodeBlock} from "@defensestation/blocknote-code";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content that we want our editor to use.
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    database: Database,
    procode: CodeBlock,
  }
});

export default schema;

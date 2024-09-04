import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import Mention from "./Mention.mjs";
import Database from "./Database.mjs";

// Our schema with inline content specs, which contain the configs and
// implementations for inline content  that we want our editor to use.
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    database: Database,
  }
});

export default schema;

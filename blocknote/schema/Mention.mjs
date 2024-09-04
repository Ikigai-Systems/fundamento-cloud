import {createReactInlineContentSpec} from "@blocknote/react";

// The Mention inline content.
const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      title: {
        default: "Untitled",
      },
      id: {
        default: -1,
      },
      entity: {
        default: "document"
      }
    },
    content: "none",
  },
);

export default Mention;

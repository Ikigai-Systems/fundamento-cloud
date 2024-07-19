import {createReactInlineContentSpec} from "@blocknote/react";

// The Mention inline content.
export const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      title: {
        default: "Untitled",
      },
      id: {
        default: -1,
      }
    },
    content: "none",
  },
  {
    render: (props) => (
      <span style={{ backgroundColor: "#8400ff33" }}>
        @{JSON.stringify(props.inlineContent.props)}
      </span>
    ),
  }
);

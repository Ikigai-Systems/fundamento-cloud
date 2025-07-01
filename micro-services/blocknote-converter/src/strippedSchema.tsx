import React from "react";
import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import {createReactBlockSpec, createReactInlineContentSpec} from "@blocknote/react";

const FormulaInlineContent = createReactInlineContentSpec(
  {
    type: "formula",
    propSchema: {
      formula: {
        default: "",
      },
      id: {
        default: "",
      }
    },
    content: "none",
  }, {
    render: () => null,
  }
);

const MentionInlineContent = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      formula: {
        default: "",
      },
      id: {
        default: "",
      }
    },
    content: "none",
  }, {
    render: () => null,
  }
);

const ButtonInlineContent = createReactInlineContentSpec(
  {
    type: "button",
    propSchema: {
      formula: {
        default: "",
      },
      id: {
        default: "",
      }
    },
    content: "none",
  }, {
    render: () => null,
  }
);

const AdvancedTable = createReactBlockSpec(
  {
    type: "advancedTable",
    propSchema: {
      tableId: {
        default: -1,
      },
      tableNpi: {
        default: "",
      },
      viewProps: {
        default: JSON.stringify({columns: {}}),
      }
    },
    content: "none",
    isSelectable: false,
  }, {
    render: ({block}) => {
      const blockProps = block.props;
      return <div>`[Table reference: {blockProps.tableNpi || blockProps.tableId}]`</div>;
    },
  }
);

const CHART_TYPES = ["line", "area", "bar", "funnel", "pie", "donut", "radialBar", "scatter", "heatmap", "radar", "polarArea", "treemap"];
const ChartBlock = createReactBlockSpec(
  {
    type: "chartBlock",
    propSchema: {
      tableNpi: {
        default: "",
      },
      title: {
        default: "",
      },
      chartType: {
        default: "line",
        values: CHART_TYPES,
      },
      xAxisColumnNpi: {
        default: "",
      },
      yAxisColumnNpi: {
        default: "",
      }
    },
    content: "none",
    isSelectable: false,
  }, {
    render: () => null,
  }
);

const strippedSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: MentionInlineContent,
    button: ButtonInlineContent,
    formula: FormulaInlineContent,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    advancedTable: AdvancedTable,
    chartBlock: ChartBlock,
    // procode: CodeBlock, // <-- to be deprecated and removed at some point
  }
});

export default strippedSchema;

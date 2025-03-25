import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import {createReactBlockSpec} from "@blocknote/react";

const AdvancedTable = createReactBlockSpec(
  {
    type: "advancedTable",
    propSchema: {
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
    render: () => null
  }
)

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
    render: () => null
  }
)

const strippedSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    // mention: MentionInlineContent,
    // button: ButtonInlineContent,
    // formula: FormulaInlineContent,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
    advancedTable: AdvancedTable,
    chartBlock: ChartBlock,
    // procode: CodeBlock, // <-- to be deprecated and removed at some point
  }
});

export default strippedSchema;

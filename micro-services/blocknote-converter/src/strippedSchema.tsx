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
    render: () => {
      return <p>Formula</p>;
    },
  }
);

const AdvancedTable = createReactBlockSpec(
  {
    type: "advancedTable",
    propSchema: {
      tableId: {
        default: -1
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
    render: (props) => {
      const {tableNpi} = props.block.props;

      const tableUrl = `https://fundamento.cloud/tables/${tableNpi}`;

      return <a href={tableUrl}>Table</a>;
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
    render: () => {
      return <p>Chart</p>;
    },
  }
);


const Loading = () => {
  return <span className="relative top-1">
    <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
  </span>;
}

// The Mention inline content.
const MentionInlineContent = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      id: {
        default: "",
      },
      entity: {
        default: "document"
      },
      entityId: {
        default: -1,
      },
      title: {
        default: "Untitled",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      let {id, entityId, entity} = props.inlineContent.props;

      const mentionUrl = `https://fundamento.cloud/${entity}/${entityId}`;

      return <a href={mentionUrl}>{mentionUrl}</a>;
    },
  }
);

const strippedSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: MentionInlineContent,
    // button: ButtonInlineContent,
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

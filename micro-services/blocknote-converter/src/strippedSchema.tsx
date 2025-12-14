import {BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs} from "@blocknote/core";
import {createReactBlockSpec, createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../app/javascript/api/DocumentsApi";
import queryClient from "../../../app/javascript/contextes/ReactQueryClient";
import {useEffect, useRef} from "react";
import UsersApi from "../../../app/javascript/api/UsersApi";
import clsx from "clsx";
import TablesApi from "../../../app/javascript/api/Tables/TablesApi";

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

const DocumentMention = ({documentNpi}) => {
  const documentQuery = useQuery({
    queryKey: ["documents", documentNpi],
    queryFn: async () => {
      return await DocumentsApi.show({npi: documentNpi});
    }}, queryClient);

  const isLoading = documentQuery.isLoading;
  const document = documentQuery.data;
  const displayName = document?.title || documentNpi;

  return (
    <a
      href={DocumentsApi.show.path({npi: document?.npi})}
      className="mention"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </a>
  )
}

const TableMention = ({tableNpi}) => {
  const contentQuery = useQuery({
    queryKey: ["tables", tableNpi],
    queryFn: async () => {
      return await TablesApi.show({npi: tableNpi});
    }}, queryClient);

  const isLoading = contentQuery.isLoading;
  const content = contentQuery.data;
  const displayName = content?.table?.name || tableNpi;

  return (
    <a
      href={TablesApi.show.path({npi: content?.table?.npi})}
      className="mention"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </a>
  )
}

const UserMention = ({mentionId, userId}: { mentionId: string, userId: number }) => {
  const spanElementRef = useRef<HTMLElement>();
  const spanElementId = `mention-${mentionId}`;
  const isTargeted = location.hash.split("#")[1] === spanElementId;

  const userQuery = useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      return await UsersApi.show({id: userId});
    }}, queryClient);

  useEffect(() => {
    setTimeout(() => {
      if (isTargeted) {
        spanElementRef.current?.scrollIntoView();
      }
    }, 0);
  }, [spanElementRef, isTargeted])

  const isLoading = userQuery.isLoading;
  const user = userQuery.data;
  const displayName = user ? `${user.firstName} ${user.lastName}` : userId;

  return (
    <span
      ref={spanElementRef}
      id={spanElementId}
      className={clsx(
        "mention",
        isTargeted && "bg-sky-500 text-white",
      )}
    >
      @{displayName}
      {isLoading && <Loading/>}
    </span>
  )
};

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
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      let {id, entityId, entity} = props.inlineContent.props;

      const mentionUrl = `https://fundamento.cloud/${entity}/${entityId}`;

      return <a href={mentionUrl}>{mentionUrl}</a>;

      useEffect(() => {
        if (entityId === -1) {
          entityId = Number(id);
          id = crypto.randomUUID();
          setTimeout(() => {
            props.updateInlineContent({
              type: "mention",
              props: {
                ...props.inlineContent.props,
                id,
                entityId,
              }
            });
          }, 0);
        }
      }, [entityId])

      if (entityId === -1) {
        return null
      }

      switch (entity) {
      case "document":
        return <DocumentMention documentNpi={entityId}/>;
      case "table":
        return <TableMention tableNpi={entityId}/>;
      case "user":
        return <UserMention mentionId={id} userId={entityId}/>;
      default:
        throw new Error(`Unhandled content type ${entity}`);
      }
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

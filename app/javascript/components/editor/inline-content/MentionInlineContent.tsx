import {createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";
import {useEffect, useRef} from "react";
import clsx from "clsx";

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
      className="border p-0.5 text-sky-500"
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
      className="border p-0.5 text-sky-500"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </a>
  )
}

const UserMention = ({mentionId, userId}: { mentionId: string, userId: number }) => {
  const spanElementRef = useRef();
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
        "border p-0.5",
        isTargeted && "bg-sky-500 text-white",
        !isTargeted && "text-sky-500"
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
      let {id, entityId} = props.inlineContent.props;
      const {entity} = props.inlineContent.props;

      useEffect(() => {
        if (entityId === -1) {
          entityId = Number(id);
          id = crypto.randomUUID();
          setTimeout(() => {
            props.updateInlineContent({
              type: "mention",
              props: {
                ...props.inlineContent.props,
                // dupa: "zupa",
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

export default MentionInlineContent;

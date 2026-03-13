import {createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";
import {useEffect, useRef} from "react";
import clsx from "clsx";
import {useCurrentDocumentId, useObjectMention, type ObjectMentionData} from "./useObjectMentions";

const Loading = () => {
  return <span className="relative top-1">
    <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
  </span>;
}

const DocumentMention = ({documentNpi, fragment}: {documentNpi: string, fragment?: string}) => {
  const documentQuery = useQuery({
    queryKey: ["documents", documentNpi],
    queryFn: async () => {
      return await DocumentsApi.show({id: documentNpi});
    }}, queryClient);

  const isLoading = documentQuery.isLoading;
  const document = documentQuery.data;
  const displayName = document?.title || documentNpi;
  const href = DocumentsApi.show.path({id: document?.id}) + (fragment ? `#${fragment}` : "");

  return (
    <a
      href={href}
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
      return await TablesApi.show({id: tableNpi});
    }}, queryClient);

  const isLoading = contentQuery.isLoading;
  const content = contentQuery.data;
  const displayName = content?.table?.name || tableNpi;

  return (
    <a
      href={TablesApi.show.path({id: content?.table?.id})}
      className="mention"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </a>
  )
}

const UserMention = ({mentionId, userId}: { mentionId: string, userId: string | number }) => {
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

const BrokenMention = ({title, targetType}: {title: string, targetType: string}) => {
  return (
    <span className="mention mention--broken" title={`Broken ${targetType.toLowerCase()} link`}>
      @{title}
    </span>
  );
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
      fragment: {
        default: "",
      },
    },
    content: "none",
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      let {id, entityId} = props.inlineContent.props;
      const {entity, title, fragment} = props.inlineContent.props;

      // Legacy migration: if entityId is -1 (old default), swap id and entityId
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

      const documentId = useCurrentDocumentId();
      const objectMention = useObjectMention(documentId, id);

      // If we have an object_mention record, use it for rendering
      if (objectMention) {
        if (objectMention.targetId === null) {
          return <BrokenMention title={objectMention.title} targetType={objectMention.targetType} />;
        }
        // Working mention — use targetId for navigation
        switch (entity) {
        case "document":
          return <DocumentMention documentNpi={objectMention.targetId} fragment={fragment}/>;
        case "table":
          return <TableMention tableNpi={objectMention.targetId}/>;
        case "user":
          return <UserMention mentionId={id} userId={objectMention.targetId}/>;
        default:
          return <BrokenMention title={title} targetType={entity} />;
        }
      }

      // Fallback: no object_mention found (unmigrated doc or unsaved mention)
      // Use existing entityId-based rendering
      switch (entity) {
      case "document":
        return <DocumentMention documentNpi={entityId} fragment={fragment}/>;
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

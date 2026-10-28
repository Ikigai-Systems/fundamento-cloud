import {createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";
import {useEffect, useRef} from "react";
import clsx from "clsx";
import {useCurrentDocumentId, useObjectReference} from "./useObjectReferences";
import ObjectIcon from "../../ObjectIcon.tsx";
import ColorLabel from "../../ColorLabel.tsx";
import {UserIcon} from "../../UserAvatar.tsx";
import {SpinnerIcon} from "../../spinners/Spinner.tsx";
import {BrokenReference, FailedReference} from "../../BrokenReference.tsx";

const Loading = () => {
  return <span className="inline-flex items-center align-middle">
    <SpinnerIcon/>
  </span>;
}

const DocumentMention = ({documentNpi, fragment, title}: {documentNpi: string, fragment?: string, title: string}) => {
  const documentQuery = useQuery({
    queryKey: ["documents", documentNpi],
    queryFn: async () => {
      return await DocumentsApi.show({id: documentNpi});
    }}, queryClient);

  if (documentQuery.isError) {
    return <FailedReference type="document" error={documentQuery.error} title={title}/>;
  }

  const isLoading = documentQuery.isLoading;
  const document = documentQuery.data;
  const displayName = document?.title || documentNpi;
  const href = DocumentsApi.show.path({id: document?.id}) + (fragment ? `#${fragment}` : "");

  return (
    <a
      href={href}
      className="mention"
    >
      <ObjectIcon type="Document" icon={document?.icon}/><ColorLabel color={document?.color}>{displayName}</ColorLabel>
      {isLoading && <Loading/>}
    </a>
  )
}

const TableMention = ({tableNpi, title}: {tableNpi: string, title: string}) => {
  const contentQuery = useQuery({
    queryKey: ["tables", tableNpi],
    queryFn: async () => {
      return await TablesApi.show({id: tableNpi});
    }}, queryClient);

  if (contentQuery.isError) {
    return <FailedReference type="table" error={contentQuery.error} title={title}/>;
  }

  const isLoading = contentQuery.isLoading;
  const content = contentQuery.data;
  const displayName = content?.table?.name || tableNpi;

  return (
    <a
      href={TablesApi.show.path({id: content?.table?.id})}
      className="mention"
    >
      <ObjectIcon type="Table" icon={content?.table?.icon}/><ColorLabel color={content?.table?.color}>{displayName}</ColorLabel>
      {isLoading && <Loading/>}
    </a>
  )
}

const UserMention = ({mentionId, userId, title}: { mentionId: string, userId: string | number, title: string }) => {
  const spanElementRef = useRef<HTMLElement>(null);
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

  // A user removed from the organization still has a record, so the reference
  // reads as working; the lookup is what finds them gone.
  if (userQuery.isError) {
    return <FailedReference type="user" error={userQuery.error} title={title}/>;
  }

  const isLoading = userQuery.isLoading;
  const user = userQuery.data;
  const displayName = user ? (user.displayName ?? `${user.firstName} ${user.lastName}`) : userId;
  
  return (
    <span
      ref={spanElementRef}
      id={spanElementId}
      className={clsx(
        "mention",
        isTargeted && "bg-sky-500 text-white",
      )}
    >
      <UserIcon user={user}/>{displayName}
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
        default: "",
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

      // Legacy migration: entityId "-1" (old default, historically the number -1)
      // means the real id was stored in `id`; swap id and entityId.
      const isLegacyEntityId = String(entityId) === "-1";

      useEffect(() => {
        if (isLegacyEntityId) {
          // Intentional local reassignment: the migrated values are persisted via updateInlineContent below.
          // eslint-disable-next-line react-hooks/exhaustive-deps
          entityId = id;
          // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (isLegacyEntityId) {
        return null
      }

      const documentId = useCurrentDocumentId();
      const objectReference = useObjectReference(documentId, id);

      // If we have an object_reference record, use it for rendering
      if (objectReference) {
        if (objectReference.targetId === null) {
          return <BrokenReference title={objectReference.title} type={objectReference.targetType}/>;
        }
        // Working mention — use targetId for navigation
        switch (entity) {
          case "document":
            return <DocumentMention documentNpi={objectReference.targetId} fragment={fragment} title={objectReference.title}/>;
          case "table":
            return <TableMention tableNpi={objectReference.targetId} title={objectReference.title}/>;
          case "user":
            return <UserMention mentionId={id} userId={objectReference.targetId} title={objectReference.title}/>;
          default:
            return <BrokenReference title={title} type={entity}/>;
        }
      }

      // Fallback: no object_reference found (unmigrated doc or unsaved mention)
      // Use existing entityId-based rendering
      switch (entity) {
        case "document":
          return <DocumentMention documentNpi={String(entityId)} fragment={fragment} title={title}/>;
        case "table":
          return <TableMention tableNpi={String(entityId)} title={title}/>;
        case "user":
          return <UserMention mentionId={id} userId={entityId} title={title}/>;
        default:
          throw new Error(`Unhandled content type ${entity}`);
      }
    },
  }
);

export default MentionInlineContent;

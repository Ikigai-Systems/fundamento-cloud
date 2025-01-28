import {createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";
import {useEffect, useRef} from "react";

const Loading = () => {
  return <span className="relative top-1">
    <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
  </span>;
}
const DocumentMention = ({documentId}) => {
  const documentQuery = useQuery({
    queryKey: ["documents", documentId], 
    queryFn: async () => {
      return await DocumentsApi.show({npi: documentId});
    }}, queryClient);
  
  const isLoading = documentQuery.isLoading;
  const document = documentQuery.data;
  const displayName = document?.title || documentId;

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
      className={`border p-0.5 ${isTargeted ? " bg-sky-500 text-white" : "text-sky-500"}`}
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
      entityId: { //formerly 'id'
        default: -1,
      },
    },
    content: "none",
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      let {id, entityId} = props.inlineContent.props;
      if (entityId === -1) {
        entityId = Number(id);
        id = crypto.randomUUID();
        props.updateInlineContent({
          type: "mention",
          props: {
            ...props.inlineContent.props,
            id,
            entityId,
          }
        });
        return null;
      }

      if (props.inlineContent.props.entity === "document") {
        return <DocumentMention documentId={entityId}/>
      } else if (props.inlineContent.props.entity === "user") {
        return <UserMention mentionId={id} userId={entityId}/>
      }
    },
  }
);

export default MentionInlineContent;

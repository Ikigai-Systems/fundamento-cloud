import {createReactInlineContentSpec} from "@blocknote/react";
import {useContext} from "react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import CurrentSpaceContext from "../../.././contextes/CurrentSpaceContext.tsx";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";

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

const UserMention = ({userId}) => {
  const userQuery = useQuery({
    queryKey: ["users", userId], 
    queryFn: async () => {
      return await UsersApi.show({id: userId});
    }}, queryClient);
  
  const isLoading = userQuery.isLoading;
  const user = userQuery.data;
  const displayName = user ? `${user.firstName} ${user.lastName}` : userId;
  
  return (
    <span
      className="border p-0.5 text-sky-500"
    >
      @{displayName}
      {isLoading && <Loading/>}
    </span>
  )
};

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
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      if (props.inlineContent.props.entity === "document") {
        return <DocumentMention documentId={props.inlineContent.props.id}/>
      } else if (props.inlineContent.props.entity === "user") {
        return <UserMention userId={props.inlineContent.props.id}/>
      }
    },
  }
);

export default Mention;

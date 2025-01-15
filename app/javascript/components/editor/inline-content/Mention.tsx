import {createReactInlineContentSpec} from "@blocknote/react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";
import TablesApi from "../../../api/Tables/TablesApi";

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
      const entity = props.inlineContent.props.entity;

      switch (entity) {
      case "document":
        return <DocumentMention documentId={props.inlineContent.props.id}/>;
      case "table":
        return <TableMention tableNpi={props.inlineContent.props.id}/>;
      case "user":
        return <UserMention userId={props.inlineContent.props.id}/>;
      default:
        throw new Error(`Unhandled content type ${entity}`);
      }
    },
  }
);

export default Mention;

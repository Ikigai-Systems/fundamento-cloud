import {createReactInlineContentSpec} from "@blocknote/react";
import {useContext} from "react";
import {useQuery} from "@tanstack/react-query";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import CurrentSpaceContext from "../../.././contextes/CurrentSpaceContext.tsx";
import queryClient from "../../.././contextes/ReactQueryClient.tsx";

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
        const documentId = props.inlineContent.props.id;
        const documentQuery = useQuery({queryKey: ["documents", documentId], queryFn: async () => {
          return (await DocumentsApi.show({id: documentId}));
        }}, queryClient);
        const isLoading = documentQuery.isLoading;
        const displayName = documentQuery.data?.title || documentId;
        const {space} = useContext(CurrentSpaceContext);
        return (
          <a
            href={DocumentsApi.edit.path({id: documentId, space_npi: space?.npi})}
            className="border p-0.5 text-sky-500"
          >
            @{displayName}
            {isLoading && <span className="relative top-1">
              <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
            </span>}
          </a>
        )
      } else if (props.inlineContent.props.entity === "user") {
        const userId = props.inlineContent.props.id;
        const userQuery = useQuery({queryKey: ["users", userId], queryFn: async () => {
          return (await UsersApi.show({id: userId}));
        }}, queryClient);
        const isLoading = userQuery.isLoading;
        const displayName = userQuery.data ? `${userQuery.data.firstName} ${userQuery.data.lastName}` : userId;
        return (
          <span
            className="border p-0.5 text-sky-500"
          >
            @{displayName}
            {isLoading && <span className="relative top-1">
              <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
            </span>}
          </span>
        )

      }

    },
  }
);

export default Mention;

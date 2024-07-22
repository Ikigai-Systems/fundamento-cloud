import {createReactInlineContentSpec} from "@blocknote/react";
import {useContext} from "react";
import {useQuery} from "@tanstack/react-query";
// @ts-expect-error "typescript does not understand ~ syntax from rails"
import DocumentsApi from "~/api/DocumentsApi"
import CurrentSpaceContext from "../../../Contextes/CurrentSpaceContext.tsx";

// The Mention inline content.
export const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      title: {
        default: "Untitled",
      },
      id: {
        default: -1,
      }
    },
    content: "none",
  },
  {
    /* eslint-disable react-hooks/rules-of-hooks */
    render: (props) => {
      const documentId = props.inlineContent.props.id;
      const documentQuery = useQuery({queryKey: ["documents", documentId], queryFn: async () => {
        return (await DocumentsApi.show({id: documentId}));
      }});
      const isLoading = documentQuery.isLoading;
      const displayName = documentQuery.data?.title || documentId;
      const {space} = useContext(CurrentSpaceContext);
      return (
        <a
          href={DocumentsApi.edit.path({id: documentId, space_id: space?.id})}
          className="border p-0.5 text-sky-500"
        >
          @{displayName}
          {isLoading && <span className="relative top-1">
            <span className="animate-spin size-5 pt-4 icon-[heroicons--arrow-path]"></span>
          </span>}
        </a>
      )
    },
  }
);

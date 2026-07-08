import AsyncSelect from "react-select/async";
import {MultiValue} from "react-select";
import DocumentsApi from "../../../api/DocumentsApi.js";
import {useQueries, useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";
import {join} from "lodash";
import {Document} from "../../../types.ts";

type FocusState = "none" | "focused" | "editing";

type DocumentOption = {
  value: string;
  title: string;
};

type DocumentsSelectCellProps = {
  data: string | null;
  setData: (value: string) => void;
  focusState: FocusState;
  setFocus: (focusState: FocusState) => void;
  isViewOnly: boolean;
};

function DocumentsSelectCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}: DocumentsSelectCellProps) {
  const documentsQuery = useQuery<Document[]>({queryKey: ["documents"], queryFn: async () => {
    return (await DocumentsApi.index());
  }}, queryClient);

  const documentIds = data ? data.split(",") : [];

  const documentQueries = useQueries({
    queries: documentIds.map((documentId: string) => ({
      queryKey: ["documents", documentId],
      queryFn: async (): Promise<Document | null> => {
        if (!documentId) {
          return null;
        }
        return (await DocumentsApi.show({id: documentId}));
      }})),
  }, queryClient);

  const selectedDocuments = documentQueries
    .filter(documentsQuery => documentsQuery.isSuccess)
    .map(documentQuery => documentQuery.data);

  function renderSelectedDocuments() {
    return documentQueries.map(documentQuery => {
      if (documentQuery.isLoading) {
        return (
          <div className="pl-2">
            <Spinner size={4}/>
          </div>
        )
      } else if (documentQuery.isError) {
        return (
          <div className="flex items-center border rounded text-red-800  px-1 truncate">
            Unable to load document
          </div>
        );
      } else if (documentQuery.isSuccess) {
        const title = documentQuery.data ? documentQuery.data.title : undefined;
        return (
          <a className="flex items-center border rounded gap-1 px-1 truncate" href={DocumentsApi.show.path({id: documentQuery.data?.id})}>
            <i className="fa-regular fa-file-lines"></i>
            {title}
          </a>
        );
      }
    })
  }

  if (focusState === "none") {
    return (
      <div className="h-8 flex flex-row items-center gap-1">
        <span/>
        {renderSelectedDocuments()}
      </div>
    );
  } else if (focusState === "focused" || isViewOnly) {
    return (
      <div className="h-8 flex flex-row items-center gap-1" onClick={() => !isViewOnly && setFocus("editing")}>
        {renderSelectedDocuments()}
      </div>
    );
  } else if (focusState === "editing" && !isViewOnly) {
    return (
      <div className="-mt-1">
        <AsyncSelect
          className="fundamento-react-select-container"
          classNamePrefix="fundamento-react-select"
          menuIsOpen={true}
          autoFocus
          cacheOptions
          defaultOptions
          isMulti={true}
          value={selectedDocuments.flatMap((document): DocumentOption[] => document ? [{ value: document.id, title: document.title }] : [])}
          loadOptions={async (_query): Promise<DocumentOption[]> =>
            (documentsQuery.data ?? []).map((document): DocumentOption => ({
              value: document.id,
              title: document.title,
            }))}
          formatOptionLabel={({title}) => {
            return (
              <div className="flex flex-row items-center">
                {title}
              </div>
            )}
          }
          onChange={(newOption: MultiValue<DocumentOption>) => {
            const documentIds = newOption.map(option => option.value);

            setData(join(documentIds));
            setFocus("focused");
          }}
        />
      </div>
    );
  }
}

export default DocumentsSelectCell;
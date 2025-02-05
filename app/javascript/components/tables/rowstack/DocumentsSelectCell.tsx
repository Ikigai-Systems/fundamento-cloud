import React from "react";
import AsyncSelect from "react-select/async";
import DocumentsApi from "../../../api/DocumentsApi.js";
import {useQueries, useQuery} from "@tanstack/react-query";
import queryClient from "../../../contextes/ReactQueryClient.tsx";
import Spinner from "../../spinners/Spinner.tsx";
import {join} from "lodash";

function DocumentsSelectCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}) {
  const documentsQuery = useQuery({queryKey: ["documents"], queryFn: async () => {
    return (await DocumentsApi.index());
  }}, queryClient);

  const documentNpis = data ? data.split(",") : [];

  const documentQueries = useQueries({
    queries: documentNpis.map(documentNpi => ({
      queryKey: ["documents", documentNpi],
      queryFn: async () => {
        if (!documentNpi) {
          return null;
        }
        return (await DocumentsApi.show({npi: documentNpi}));
      }})),
  }, queryClient);

  const selectedDocuments = documentQueries.map(documentQuery => documentQuery.data);

  function renderSelectedDocuments() {
    return documentQueries.map(documentQuery => {
      if (documentQuery.isLoading) {
        return (<div className="pl-2">
          <Spinner size={4}/>
        </div>)
      } else {
        if (documentQuery.isError) {
          return (
            <div className="flex flex-row items-center text-red-800">
              Unable to load document with id '{documentNpi}'
            </div>
          );
        } else if (selectedDocuments === null) {
          return (<>
            <div className="flex flex-row items-center flex-grow h-8" onClick={() => {}}>
            </div>
          </>);
        } else {
          const title = documentQuery.data ? documentQuery.data.title : undefined;
          return (<>
            <a className="flex items-center border rounded gap-1 px-1 truncate" href={DocumentsApi.show.path({npi: documentQuery.data.npi})}>
              <i className="fa-regular fa-file-lines"></i>
              {title}
            </a>
          </>);
        }
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
          menuIsOpen={true}
          autoFocus
          cacheOptions
          defaultOptions
          isMulti={true}
          value={selectedDocuments.map(document => ({ value: document.npi, title: document.title }))}
          loadOptions={async (query) => {
            return [{
              value: undefined, title: "leave empty",
            }].concat(
              documentsQuery.data.map(document => ({
                value: document.npi,
                title: document.title,
              }))
            );
          }}
          formatOptionLabel={({value, title}) => {
            if (!value) {
              return <div className="italic">Empty</div>
            }
            return (
              <div className="flex flex-row items-center ml-2">
                {title}
              </div>
            )}
          }
          onChange={(newOption) => {
            const documentNpis = Array.from(newOption.values().map(value => value.value));

            setData(join(documentNpis));
            setFocus("focused");
          }}
          styles={{
            input: (base) => ({
              ...base,
              "input:focus": {
                boxShadow: "none",
              },
            }),
          }}
        />
      </div>
    );
  }
}

export default DocumentsSelectCell;
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
              {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] mt-[-2px] size-6 icon-[heroicons--chevron-down-16-solid]"></span>}
            </div>
          </>);
        } else {
          const title = documentQuery.data ? documentQuery.data.title : undefined;
          return (<>
            <div className="flex flex-row items-center flex-grow" onClick={() => {}}>
              {title}
              {focusState === "focused" && !isViewOnly && <span className="ml-auto mr-[7px] mt-[-2px] size-6 icon-[heroicons--chevron-down-16-solid]"></span>}
            </div>
          </>);
        }
      }
    })
  }

  if (focusState === "none") {
    return (
      <div className="h-8 flex flex-row items-center">
        <span/>
        {renderSelectedDocuments()}
      </div>
    );
  } else if (focusState === "focused" || isViewOnly) {
    return (
      <div className="h-8 flex flex-row items-center" onClick={() => !isViewOnly && setFocus("editing")}>
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
          // value={{value: userId, initials: selectedUser.firstName[0] + selectedUser.lastName[0], displayName: `${selectedUser.firstName} ${selectedUser.lastName}`}}
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
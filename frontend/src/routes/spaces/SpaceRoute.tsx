import HeaderAndLeftSideBarLayout from "../../Layouts/HeaderAndLeftSideBarLayout.tsx";
import axios from "axios";
import {Document, Space} from "../../types.ts";
import {Link, Outlet, Params, useLoaderData, useParams} from "react-router-dom";
import CenteredSpinnerCover from "../../Components/Spinners/CenteredSpinnerCover.tsx";
import {useState} from "react";

export const spaceLoader = async ({params}: {params: Params<"spaceId">}) => {
  //todo: reuse already fetched space (i.e. from '/spaces' route) if possible
  const space = (await axios.get(`/api/v1/spaces/${params.spaceId}`)).data as Space;
  const documents = (await axios.get('/api/v1/documents', {params: {
    id: space.hierarchy,
  }})).data as Document[];
  return {space, documents};
};

// type SpaceProps = {
// }

const SpaceRoute = (/*SpaceProps*/) => {
  const loaderData = useLoaderData() as {space: Space, documents: Document[]};
  const [documents, setDocuments] = useState(loaderData.documents);
  const [space, setSpace] = useState(loaderData.space);
  const {documentId: selectedDocumentId} = useParams();
  const [isNewDocumentButtonLoading, setNewDocumentButtonLoading] = useState(false);

  const leftSideBarContent = function() {
    if (documents === undefined) {
      return <CenteredSpinnerCover/>
    }

    const hierarchy = space.hierarchy || [];

    return <div className="p-4 flex flex-col">
      <div className="m-x-4 p-b-4 font-bold">Documents</div>
      {hierarchy.map((documentId: number) => {
        return <div
          key={documentId}
          className={`flex-auto ${documentId.toString() === selectedDocumentId ? " bg-blue-1 hover:bg-blue-2 active:bg-blue-3" : "hover:bg-gray-1 active:bg-gray-2"}`}
        >
          <Link replace to={{pathname: `documents/${documentId}`, search: window.location.search}}>
            <div className="text-left m-x-2 p-2">
              {documentId}
            </div>
          </Link>
        </div>
      })}
      <div className="m-t m-b border-solid border-b-1 border-0 border-b-gray-3"/>
      <button title="Create new document" className="self-end hover:bg-gray-1 active:bg-gray-2" onClick={async () => {
        try {
          setNewDocumentButtonLoading(true);
          const documentResponse= await axios.post("api/v1/documents", {});
          const newDocument = documentResponse.data;
          setDocuments(prevState => {
            return [...prevState, newDocument];
          });
          await axios.patch(`api/v1/spaces/${space.id}`, {space: {hierarchy: [...hierarchy, newDocument.id]}});
          setSpace(prevState => {
            return {
              ...prevState,
              hierarchy: [...(prevState.hierarchy || []), newDocument.id]
            }
          });
        } finally {
          setNewDocumentButtonLoading(false);
        }
      }}>
        <span className={isNewDocumentButtonLoading ? "i-line-md-loading-loop" : "i-ic-baseline-plus"}>
          Add
        </span>
      </button>
    </div>
  }

  return <HeaderAndLeftSideBarLayout
    leftSideBarContent={leftSideBarContent()}
    topHeaderContent={<div>Space: {space.id}</div>}
  >
    <Outlet/>
  </HeaderAndLeftSideBarLayout>
}

export default SpaceRoute;
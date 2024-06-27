import HeaderAndLeftSideBarLayout from "../../Layouts/HeaderAndLeftSideBarLayout.tsx";
import axios from "axios";
import {Document, Space} from "../../types.ts";
import {Link, Outlet, Params, useLoaderData} from "react-router-dom";
import CenteredSpinnerCover from "../../Components/Spinners/CenteredSpinnerCover.tsx";

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
  const {space, documents} = useLoaderData() as {space: Space, documents: Document[]};

  const leftSideBarContent = function() {
    if (documents === undefined) {
      return <CenteredSpinnerCover/>
    }

    return <div className="p-4">
      <div className="m-x-4 p-b-4 font-bold">Documents</div>
      {documents.map((document: Document) => {
        return <div
          key={document.id}
          // className={`${document.id === documentId ? " bg-blue-1 hover:bg-blue-2 active:bg-blue-3" : "hover:bg-gray-1 active:bg-gray-2"} p-1 cursor-pointer`}
          className={"flex-auto hover:bg-gray-1 active:bg-gray-2"}
          onClick={() => {
            // setDocumentId(document.id);
          }}
        >
          <Link to={{pathname: `documents/${document.id}`, search: window.location.search}}>
            <div className="text-left m-x-2 p-2">
              {document.id}
            </div>
          </Link>
        </div>
      })}
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
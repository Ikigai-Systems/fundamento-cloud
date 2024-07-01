import HeaderAndLeftSideBarLayout from "../../Layouts/HeaderAndLeftSideBarLayout.tsx";
import axios from "axios";
import {Link, useLoaderData} from "react-router-dom";
import {Space} from "../../types.ts";
import {useState} from "react";

// todo: extract to separate file:
export const spacesLoader = async () => {
  const response = await axios.get("/api/v1/spaces");
  return {spaces: response.data};
};

// type SpacesProps = {
// }

const Spaces = (/*SpacesProps*/) => {
  const loaderSpaces = (useLoaderData() as {spaces: Space[]}).spaces;
  const [spaces, setSpaces] = useState(loaderSpaces);
  const [isNewSpaceButtonLoading, setNewSpaceButtonLoading] = useState(false);

  return <HeaderAndLeftSideBarLayout
    leftSideBarContent={
      <div className="p-4 flex flex-col">
        {spaces.map((space: Space) => {
          return <div key={space.id}
            className="flex-auto hover:bg-gray-1 active:bg-gray-2"
          >
            <Link to={{pathname: `/spaces/${space.id}`, search: window.location.search}}>
              <div className="text-left m-x-2 p-2">
                {space.id}
              </div>
            </Link>
          </div>
        })}
        <div className="m-t m-b border-solid border-b-1 border-0 border-b-gray-3"/>
        <button title="Create new space" className="self-end hover:bg-gray-1 active:bg-gray-2" onClick={async () => {
          try {
            setNewSpaceButtonLoading(true);
            const response = await axios.post("api/v1/spaces", {});
            setSpaces((prevState: Space[]) => {
              const newState = [...prevState, response.data];
              return newState;
            });
          } finally {
            setNewSpaceButtonLoading(false);
          }
        }}>
          <span className={isNewSpaceButtonLoading ? "i-line-md-loading-loop" : "i-ic-baseline-plus"}>
            Add
          </span>
        </button>
      </div>
    }
    topHeaderContent={<div>Spaces</div>}
  />
}

export default Spaces;
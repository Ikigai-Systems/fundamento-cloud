import HeaderAndLeftSideBarLayout from "../../Layouts/HeaderAndLeftSideBarLayout.tsx";
import axios from "axios";
import {Link, useLoaderData} from "react-router-dom";
import {Space} from "../../types.ts";

// todo: extract to separate file:
export const spacesLoader = async () => {
  const response = await axios.get("/api/v1/spaces");
  return {spaces: response.data};
};

// type SpacesProps = {
// }

const Spaces = (/*SpacesProps*/) => {
  const {spaces} = useLoaderData() as {spaces: Space[]};

  return <HeaderAndLeftSideBarLayout
    leftSideBarContent={
      <div className="p-4">
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
      </div>
    }
    topHeaderContent={<div>Spaces</div>}
  />
}

export default Spaces;
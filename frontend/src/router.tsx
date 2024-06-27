import {createBrowserRouter, Navigate} from "react-router-dom";
import ErrorRoute from './routes/ErrorRoute.tsx';
import SpaceRoute, {spaceLoader} from "./routes/spaces/SpaceRoute.tsx";
import SpacesRoute, {spacesLoader} from "./routes/spaces/SpacesRoute.tsx";
import axios from "axios";
import baseUrl from "./base-url.tsx";
import DocumentRoute, {documentLoader} from "./routes/spaces/DocumentRoute.tsx";

axios.defaults.baseURL = baseUrl;

const router = createBrowserRouter([{
  path: "/",
  element: <Navigate replace to={{pathname: '/spaces', search: window.location.search}}/>,
  errorElement: <ErrorRoute/>,
},{
  path: "/spaces",
  element: <SpacesRoute/>,
  loader: spacesLoader,
},{
  path: "/spaces/:spaceId",
  element: <SpaceRoute/>,
  loader: spaceLoader,
  children: [{
    path: "documents/:documentId",
    element: <DocumentRoute/>,
    loader: documentLoader,
  }]
}]);

export default router;
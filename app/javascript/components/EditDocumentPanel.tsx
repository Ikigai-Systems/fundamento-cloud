import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {Features, FeaturesContext} from "../contextes/FeaturesContext.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
  databaseId: string,
  features?: Features,
}

const EditDocumentPanel = ({document, space, currentUser, databaseId, features}: EditDocumentPanelProps) => {
  return <FeaturesContext.Provider value={features || []}>
    <QueryClientProvider client={queryClient}>
      <CurrentSpaceContext.Provider value={{space}}>
        <Editor
          currentUser={currentUser}
          document={document}
          databaseId={databaseId}
        />
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  </FeaturesContext.Provider>
}

export default EditDocumentPanel;

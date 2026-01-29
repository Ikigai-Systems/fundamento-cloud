import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {DocumentTitleInput} from "./ContentTitle.tsx";
import {Features, FeaturesContext} from "../contextes/FeaturesContext.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
  databaseId: string,
  features?: Features,
}

function EditDocumentComponent(props: {
    document: Document,
    currentUser: User,
    databaseId: string
}) {
  return <>
    <div className="content-editor-padding">
      <DocumentTitleInput document={props.document}/>
    </div>

    <div className="editor-container">
      <Editor
        currentUser={props.currentUser}
        document={props.document}
        databaseId={props.databaseId}
      />
    </div>
  </>;
}

const EditDocumentPanel = ({document, space, currentUser, databaseId, features}: EditDocumentPanelProps) => {
  return <FeaturesContext.Provider value={features || []}>
    <QueryClientProvider client={queryClient}>
      <CurrentSpaceContext.Provider value={{space}}>
        <EditDocumentComponent
          document={document}
          currentUser={currentUser}
          databaseId={databaseId}/>
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  </FeaturesContext.Provider>
}

export default EditDocumentPanel;
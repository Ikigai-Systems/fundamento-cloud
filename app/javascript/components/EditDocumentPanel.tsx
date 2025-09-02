import {Document, Space, User} from "../types";
import Editor from "./editor/Editor";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import {DocumentTitleInput} from "./ContentTitle.tsx";
import HtmlEditor from "./HtmlEditor/HtmlEditor.tsx";
import {Features, FeaturesContext, useFeaturesContext} from "../contextes/FeaturesContext.tsx";

type EditDocumentPanelProps = {
  document: Document,
  space: Space,
  currentUser: User,
  databaseId: string,
  contentHtml: string,
  revisions: string,
  operationsA?: string,
  operationsB?: string,
  features?: Features,
}

function EditDocumentComponent(props: {
    document: Document,
    initialData: string,
    revisions: string,
    operationsA: string | undefined,
    operationsB: string | undefined,
    currentUser: User,
    databaseId: string
}) {
  const features = useFeaturesContext();
   
  return <>
    <div className="content-editor-padding">
      <DocumentTitleInput document={props.document}/>
    </div>

    {features.includes("ck_editor") &&
        <div className="html-editor-container">
          <HtmlEditor initialData={props.initialData} revisions={JSON.parse(props.revisions || "[]")}
            operationsA={JSON.parse(props.operationsA || "[]")}
            operationsB={JSON.parse(props.operationsB || "[]")} document={props.document}
            currentUser={props.currentUser}/>
        </div>
    }

    <div className="editor-container">
      <Editor
        currentUser={props.currentUser}
        document={props.document}
        databaseId={props.databaseId}
        contentHtml={props.initialData}
      />
    </div>
  </>;
}

const EditDocumentPanel = ({document, space, currentUser, databaseId, contentHtml, revisions, operationsA, operationsB, features}: EditDocumentPanelProps) => {
  return <FeaturesContext.Provider value={features || []}>
    <QueryClientProvider client={queryClient}>
      <CurrentSpaceContext.Provider value={{space}}>
        <EditDocumentComponent 
          document={document} 
          initialData={contentHtml} 
          revisions={revisions}
          operationsA={operationsA}
          operationsB={operationsB}
          currentUser={currentUser}
          databaseId={databaseId}/>
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  </FeaturesContext.Provider>
}

export default EditDocumentPanel;
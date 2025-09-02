import {Document, Space, Version, User} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from ".././contextes/CurrentSpaceContext";
import queryClient from ".././contextes/ReactQueryClient.tsx";
import {useCreateBlockNote} from "@blocknote/react";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import "./editor/editor-styles.css";
import schema from "./editor/schema.ts";

import {createFileUrlResolver} from "./editor/utils/createFileUrlResolver.tsx";
import {ContentTitle} from "./ContentTitle.tsx";

import 'ckeditor5/ckeditor5.css';
import HtmlEditor from "./HtmlEditor/HtmlEditor.tsx";
import {Features, FeaturesContext, useFeaturesContext} from "../contextes/FeaturesContext.tsx";

type ShowVersionPanelProps = {
  version: Version,
  document: Document,
  space: Space,
  currentUser: User,
  features?: Features,
}

function ShowVersionComponent(props: {
    document: Document,
    initialData: string,
    version: Version,
    revisions: any,
    operations: string,
    currentUser: User,
    editor: BlockNoteEditor<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
}) {
  const features = useFeaturesContext();
  
  return <>
    <div className="content-editor-padding">
      <ContentTitle document={props.document}/>
    </div>

    {features.includes("ck_editor") &&
        <div className="html-editor-container">
          <HtmlEditor initialData={props.initialData} document={props.document} version={props.version}
            revisions={JSON.parse(props.revisions || "[]")}
            operationsA={JSON.parse(props.operations || "[]")} currentUser={props.currentUser}
            readOnly={true}/>
        </div>
    }

    <div className="editor-container">
      <BlockNoteView editor={props.editor} editable={false}/>
    </div>
  </>;
}

const ShowVersionPanel = ({version, document, space, currentUser, features}: ShowVersionPanelProps) => {
  const editor = useCreateBlockNote({
    schema,
    initialContent: version.contentBlocks,
    resolveFileUrl: createFileUrlResolver(),
  });

  return <FeaturesContext.Provider value={features || []}>
    <QueryClientProvider client={queryClient}>
      <CurrentSpaceContext.Provider value={{space}}>
        <ShowVersionComponent 
          document={document} 
          initialData={version.contentHtml} 
          version={version}
          revisions={version.revisions} 
          operations={version.operations}
          currentUser={currentUser} 
          editor={editor}
        />
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  </FeaturesContext.Provider>
}

export default ShowVersionPanel;
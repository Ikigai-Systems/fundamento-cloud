import {Document, Space, Version, User} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from ".././contextes/CurrentSpaceContext";
import queryClient from ".././contextes/ReactQueryClient.tsx";
import {useCreateBlockNote} from "@blocknote/react";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import schema from "./editor/schema.ts";

import {createFileUrlResolver} from "./editor/utils/createFileUrlResolver.tsx";
import {ContentTitle} from "./ContentTitle.tsx";

import {Features, FeaturesContext} from "../contextes/FeaturesContext.tsx";

type ShowVersionPanelProps = {
  version: Version,
  document: Document,
  space: Space,
  currentUser: User,
  features?: Features,
}

function ShowVersionComponent(props: {
    document: Document,
    editor: BlockNoteEditor<DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema>
}) {
  return <>
    <div className="content-editor-padding">
      <ContentTitle document={props.document}/>
    </div>

    <div className="editor-container">
      <BlockNoteView editor={props.editor} editable={false} data-document-editor/>
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
          editor={editor}
        />
      </CurrentSpaceContext.Provider>
    </QueryClientProvider>
  </FeaturesContext.Provider>
}

export default ShowVersionPanel;
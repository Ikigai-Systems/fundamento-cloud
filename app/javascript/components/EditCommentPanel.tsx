import {Document, Space, User} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import CommentEditor from "./editor/CommentEditor.tsx";

type EditCommentPanelProps = {
  document: Document,
  space: Space,
  editable?: boolean,
  comment?: any,
}

const EditCommentPanel = ({document, space, editable, comment}: EditCommentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <CommentEditor
        documentId={document.id}
        editable={editable}
        comment={comment}
      />
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditCommentPanel;
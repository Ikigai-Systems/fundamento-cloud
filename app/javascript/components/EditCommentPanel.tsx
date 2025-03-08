import {Document, Space, Table, User} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import CommentEditor from "./editor/CommentEditor.tsx";

type EditCommentPanelProps = {
  object: Document | Table,
  space: Space,
  editable?: boolean,
  comment?: any,
}

const EditCommentPanel = ({object, space, editable, comment}: EditCommentPanelProps) => {
  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <CommentEditor
        objectId={object.id}
        editable={editable}
        comment={comment}
      />
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditCommentPanel;
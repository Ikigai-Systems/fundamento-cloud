import {useState, useRef, useCallback} from "react";
import {Document, Space, Table} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import CommentEditor, {CommentEditorHandle} from "./editor/CommentEditor.tsx";

type CommentData = {
  id: number,
  content: any,
}

type EditCommentPanelProps = {
  object: Document | Table,
  space: Space,
  comment?: CommentData,
  canEdit?: boolean,
  objectGid?: string,
}

const EditCommentPanel = ({object, space, comment, canEdit = false, objectGid}: EditCommentPanelProps) => {
  const isNewComment = !comment;
  const [editing, setEditing] = useState(isNewComment);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<CommentEditorHandle>(null);
  const snapshotRef = useRef<any>(null);

  const startEditing = useCallback(() => {
    if (editorRef.current) {
      snapshotRef.current = structuredClone(editorRef.current.getContent());
    }
    setEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    if (editorRef.current && snapshotRef.current) {
      editorRef.current.replaceContent(snapshotRef.current);
    }
    setEditing(false);
  }, []);

  const saveComment = useCallback(async () => {
    if (!editorRef.current || !comment || !objectGid) return;

    setSaving(true);
    try {
      const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
      const content = editorRef.current.getContent();

      const response = await fetch(`/comments/${comment.id}?object_gid=${encodeURIComponent(objectGid)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken || "",
          "Turbo-Frame": "object_comments",
        },
        body: JSON.stringify({ comment: { content: JSON.stringify(content) } }),
      });

      if (response.ok) {
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }, [comment, objectGid]);

  const deleteComment = useCallback(async () => {
    if (!comment || !objectGid) return;

    const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

    await fetch(`/comments/${comment.id}?object_gid=${encodeURIComponent(objectGid)}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken || "",
        "Turbo-Frame": "object_comments",
      },
    });
  }, [comment, objectGid]);

  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      {canEdit && !editing && (
        <div className="flex gap-2 justify-end pr-3 -mt-1 mb-1">
          <button onClick={startEditing} className="text-sm text-gray-400 hover:text-gray-600" title="Edit">
            <i className="fa fa-pencil"></i>
          </button>
          <button onClick={deleteComment} className="text-sm text-gray-400 hover:text-red-600" title="Delete">
            <i className="fa fa-trash"></i>
          </button>
        </div>
      )}
      <CommentEditor
        ref={editorRef}
        objectId={object.id}
        editable={editing}
        initialContent={comment?.content}
      />
      {canEdit && editing && (
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={saveComment} disabled={saving} className="primary-button text-sm">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={cancelEditing} disabled={saving} className="secondary-button text-sm">
            Cancel
          </button>
        </div>
      )}
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditCommentPanel;

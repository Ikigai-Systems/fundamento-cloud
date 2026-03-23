import {useState, useRef, useCallback, useEffect} from "react";
import {Document, Space, Table} from "../types";
import {QueryClientProvider} from "@tanstack/react-query";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient.tsx";
import CommentEditor, {CommentEditorHandle} from "./editor/CommentEditor.tsx";

type CommentData = {
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BlockNote document content, see CommentEditor.tsx
  content: any,
}

type EditCommentPanelProps = {
  object: Document | Table,
  space: Space,
  comment: CommentData,
  objectGid: string,
  editing?: boolean,
  onSaved?: () => void,
  onCancelled?: () => void,
}

const EditCommentPanel = ({object, space, comment, objectGid, editing = false, onSaved, onCancelled}: EditCommentPanelProps) => {
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<CommentEditorHandle>(null);

  // Captured when entering edit mode so Cancel can restore the original content.
  // structuredClone is required because getContent() returns a live reference
  // to BlockNote's internal document — without cloning, edits would mutate the
  // snapshot and Cancel would have nothing to restore.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BlockNote document content, see CommentEditor.tsx
  const contentBeforeEditingRef = useRef<any>(null);

  // Tracks the previous value of `editing` to detect the false→true transition.
  // Without this, the effect would re-capture on every re-render while editing,
  // overwriting the snapshot with already-modified content.
  const wasEditingRef = useRef(false);

  useEffect(() => {
    const justEnteredEditMode = editing && !wasEditingRef.current;

    if (justEnteredEditMode && editorRef.current) {
      contentBeforeEditingRef.current = structuredClone(editorRef.current.getContent());
    }

    wasEditingRef.current = editing;
  }, [editing]);

  const cancelEditing = useCallback(() => {
    if (editorRef.current && contentBeforeEditingRef.current) {
      editorRef.current.replaceContent(contentBeforeEditingRef.current);
    }

    onCancelled?.();
  }, [onCancelled]);

  const saveComment = useCallback(async () => {
    if (!editorRef.current) return;

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
        body: JSON.stringify({comment: {content: JSON.stringify(content)}}),
      });

      if (response.ok) {
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }, [comment, objectGid, onSaved]);

  return <QueryClientProvider client={queryClient}>
    <CurrentSpaceContext.Provider value={{space}}>
      <CommentEditor
        ref={editorRef}
        objectId={object.id}
        editable={editing}
        initialContent={comment.content}
      />

      {editing && (
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={saveComment} disabled={saving} className="primary-button">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={cancelEditing} disabled={saving} className="secondary-button">
            Cancel
          </button>
        </div>
      )}
    </CurrentSpaceContext.Provider>
  </QueryClientProvider>
}

export default EditCommentPanel;

import {useMemo} from "react";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import schema from "./schema";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import LoadingContent from "./LoadingContent.tsx";
import {CommonSuggestionMenus} from "./CommonSuggestionMenus.tsx";

type CommentEditorProps = {
  objectId: number,
  comment: any,
  editable?: boolean,
}

const CommentEditor = ({objectId, comment, editable = true}: CommentEditorProps) => {
  const editor = useMemo(() => {
    const commentEditor = BlockNoteEditor.create({
      schema,
      initialContent: comment,
      uploadFile: uploadFile(objectId),
      resolveFileUrl: createFileUrlResolver(),
    });

    if (editable) {
      window.commentEditor = commentEditor; // for .erb button_to hacks to work (see app/views/documents/edit.html.erb#save_this_as_version) + for displaying document Structure in right sidebar
    }
    
    return commentEditor;
  }, []);

  if (editor === undefined) {
    return <LoadingContent/>
  }

  return <>
    <BlockNoteView editor={editor} slashMenu={false} sideMenu={false} editable={editable} data-comment-editor>
      {/* Replaces the default Slash Menu. */}
      <CommonSuggestionMenus editor={editor}/>
    </BlockNoteView>
  </>
}

export default CommentEditor;
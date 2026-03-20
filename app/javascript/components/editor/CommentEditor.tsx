import {useMemo, useImperativeHandle, forwardRef} from "react";
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
  initialContent?: any,
  editable?: boolean,
}

export type CommentEditorHandle = {
  getContent: () => any;
  replaceContent: (content: any) => void;
}

const CommentEditor = forwardRef<CommentEditorHandle, CommentEditorProps>(
  ({objectId, initialContent, editable = true}, ref) => {
    const editor = useMemo(() => {
      const commentEditor = BlockNoteEditor.create({
        schema,
        initialContent,
        uploadFile: uploadFile(objectId),
        resolveFileUrl: createFileUrlResolver(),
      });

      if (editable) {
        window.commentEditor = commentEditor;
      }

      return commentEditor;
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => editor.document,
      replaceContent: (content: any) => {
        editor.replaceBlocks(editor.document, content);
      },
    }), [editor]);

    if (editor === undefined) {
      return <LoadingContent/>
    }

    return <>
      <BlockNoteView editor={editor} slashMenu={false} sideMenu={false} editable={editable} data-comment-editor>
        <CommonSuggestionMenus editor={editor}/>
      </BlockNoteView>
    </>
  }
);

export default CommentEditor;

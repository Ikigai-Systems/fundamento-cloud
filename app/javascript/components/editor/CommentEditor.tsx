import {useMemo, useImperativeHandle, useEffect, forwardRef} from "react";
import {BlockNoteEditor} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import schema from "./schema";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import LoadingContent from "./LoadingContent.tsx";
import {CommonSuggestionMenus} from "./CommonSuggestionMenus.tsx";

// BlockNote document content requires threading complex generics (Block<BSchema, ISchema, SSchema>[])
// through every consumer. Using any here is intentional until we adopt BlockNote's full type system.
/* eslint-disable @typescript-eslint/no-explicit-any */
type CommentEditorProps = {
  objectId: number,
  initialContent?: any,
  editable?: boolean,
  onContentChange?: (content: any) => void,
}

export type CommentEditorHandle = {
  getContent: () => any;
  replaceContent: (content: any) => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const CommentEditor = forwardRef<CommentEditorHandle, CommentEditorProps>(
  ({objectId, initialContent, editable = true, onContentChange}, ref) => {
    const editor = useMemo(() => BlockNoteEditor.create({
      schema,
      initialContent,
      uploadFile: uploadFile(objectId),
      resolveFileUrl: createFileUrlResolver(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editor must be created once on mount; recreating it on prop changes would reset content
    }), []);

    useEffect(() => {
      if (!onContentChange) return;

      return editor.onChange(() => onContentChange(editor.document));
    }, [editor, onContentChange]);

    useImperativeHandle(ref, () => ({
      getContent: () => editor.document,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BlockNote replaceBlocks accepts PartialBlock[] but content comes from getContent() round-trip
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

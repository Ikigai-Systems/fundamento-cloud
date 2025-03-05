import {useMemo} from "react";
import {BlockNoteEditor, filterSuggestionItems} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import '@blocknote/mantine/style.css';
import {
  BlockColorsItem,
  DragHandleMenu,
  getDefaultReactSlashMenuItems,
  RemoveBlockItem,
  SideMenu,
  SideMenuController,
  SuggestionMenuController,
} from "@blocknote/react";
import schema from "./schema";
import {getMentionMenuItems} from "./inline-content/mentionMenuItems.ts";
import AdvancedTableMenuItem from "./blocks/AdvancedTableMenuItem.tsx";
import ChartBlockMenuItem from "./blocks/ChartBlockMenuItem.tsx";
import "./editor-styles.css";
import {uploadFile} from "./utils/uploadFile.tsx";
import {createFileUrlResolver} from "./utils/createFileUrlResolver.tsx";
import TurnIntoItem from "./drag-handle/TurnIntoItem.tsx";
import ButtonInlineContentMenuItem from "./inline-content/ButtonInlineContentMenuItem.tsx";
import FormulaInlineContentMenuItem from "./inline-content/FormulaInlineContentMenuItem.tsx";
import LoadingContent from "./LoadingContent.tsx";

type CommentEditorProps = {
  documentId: number,
  comment: any,
  editable?: boolean,
}

const CommentEditor = ({documentId, comment, editable = true}: CommentEditorProps) => {
  const editor = useMemo(() => {
    const commentEditor = BlockNoteEditor.create({
      schema,
      initialContent: comment,
      uploadFile: uploadFile(documentId),
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
    <BlockNoteView editor={editor} slashMenu={false} sideMenu={false} editable={editable}>
      {/* Replaces the default Slash Menu. */}
      <SuggestionMenuController
        triggerCharacter={"/"}
        getItems={async (query) => {
          // Gets all default slash menu items and `insertAlert` item.
          let defaultTableMenuItem = undefined;
          const itemsWithoutTable = getDefaultReactSlashMenuItems(editor).filter(defaultMenuItem => {
            if (defaultMenuItem.key === 'table') {
              defaultTableMenuItem = defaultMenuItem;
              return false;
            } else {
              return true;
            }
          });
          defaultTableMenuItem.title = "Grid table";
          defaultTableMenuItem.subtext = "Simple rows and columns formatting";

          return filterSuggestionItems(
            [
              ...itemsWithoutTable,
              defaultTableMenuItem,
              AdvancedTableMenuItem(),
              ChartBlockMenuItem(),
              ButtonInlineContentMenuItem(),
              FormulaInlineContentMenuItem(),
            ],
            query
          )
        }}
      />
      <SuggestionMenuController
        // Gets the mentions menu items
        triggerCharacter={"@"}
        getItems={async (query) =>
          filterSuggestionItems(await getMentionMenuItems(), query)
        }
      />
      <SideMenuController
        sideMenu={(props) => (
          <SideMenu {...props}
            dragHandleMenu={(props) => (
              <DragHandleMenu {...props}>
                <TurnIntoItem {...props}>Turn into</TurnIntoItem>
                <RemoveBlockItem {...props}>Delete</RemoveBlockItem>
                <BlockColorsItem {...props}>Colors</BlockColorsItem>
              </DragHandleMenu>
            )}
          />
        )}
      />
    </BlockNoteView>
  </>
}

export default CommentEditor;
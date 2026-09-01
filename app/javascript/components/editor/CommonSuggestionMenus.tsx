import {
  BlockColorsItem,
  DefaultReactSuggestionItem,
  DragHandleMenu,
  getDefaultReactSlashMenuItems,
  RemoveBlockItem,
  SideMenu,
  SideMenuController,
  SuggestionMenuController
} from "@blocknote/react";
import {filterSuggestionItems} from "@blocknote/core/extensions";
import AdvancedTableMenuItem from "./blocks/AdvancedTableMenuItem.tsx";
import ChartBlockMenuItem from "./blocks/ChartBlockMenuItem.tsx";
import ButtonInlineContentMenuItem from "./inline-content/ButtonInlineContentMenuItem.tsx";
import FormulaInlineContentMenuItem from "./inline-content/FormulaInlineContentMenuItem.tsx";
import {getMentionMenuItems} from "./inline-content/mentionMenuItems.tsx";
import TurnIntoItem from "./drag-handle/TurnIntoItem.tsx";
import schema from "./schema.ts";

type Editor = typeof schema.BlockNoteEditor;

// The default slash menu items returned by `getDefaultReactSlashMenuItems` carry
// a `key` at runtime (used to identify built-in blocks such as the table), but
// BlockNote's public type omits it. We re-expose it here to detect the table item.
type DefaultSlashItem = DefaultReactSuggestionItem & {key?: string};

// Custom slash menu items receive the editor when clicked (BlockNote invokes
// `onItemClick(editor)` at runtime). Adapting them to `DefaultReactSuggestionItem`,
// whose `onItemClick` takes no arguments, keeps the whole list uniformly typed.
function adaptItem(
  editor: Editor,
  item: {title: string; onItemClick: (editor: Editor) => void} & Omit<DefaultReactSuggestionItem, "title" | "onItemClick">
): DefaultReactSuggestionItem {
  return {...item, onItemClick: () => item.onItemClick(editor)};
}

export function CommonSuggestionMenus({editor}: {editor: Editor}) {
  return <>
    <SuggestionMenuController
      triggerCharacter={"/"}
      getItems={async (query): Promise<DefaultReactSuggestionItem[]> => {
        // Gets all default slash menu items and `insertAlert` item.
        const defaultItems = getDefaultReactSlashMenuItems(editor) as DefaultSlashItem[];
        const itemsWithoutTable = defaultItems.filter(defaultMenuItem => defaultMenuItem.key !== "table");
        const defaultTableMenuItem = defaultItems.find(defaultMenuItem => defaultMenuItem.key === "table");

        const tableItems: DefaultReactSuggestionItem[] = [];
        if (defaultTableMenuItem) {
          tableItems.push({
            ...defaultTableMenuItem,
            title: "Grid table",
            subtext: "Simple rows and columns formatting",
          });
        }

        return filterSuggestionItems(
          [
            ...itemsWithoutTable,
            ...tableItems,
            adaptItem(editor, AdvancedTableMenuItem()),
            adaptItem(editor, ChartBlockMenuItem()),
            adaptItem(editor, ButtonInlineContentMenuItem()),
            adaptItem(editor, FormulaInlineContentMenuItem()),
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
  </>;
}
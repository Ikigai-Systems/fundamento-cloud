import {
  BlockColorsItem,
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
import {getMentionMenuItems} from "./inline-content/mentionMenuItems.ts";
import TurnIntoItem from "./drag-handle/TurnIntoItem.tsx";

export function CommonSuggestionMenus({editor}) {
  return <>
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
  </>;
}
import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document, Table, User} from "../../../types.ts";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";
import schema from "../schema.ts";
import ObjectIcon from "../../ObjectIcon.tsx";

function createMentionItem(entity: string, entityId: string | number, title: string, icon?: JSX.Element) {
  return {
    // TODO: Change SuggestionMenu.tsx in blocknote to use - key: `${entity}/${id}`,
    title,
    icon,
    onItemClick: (editor: typeof schema.BlockNoteEditor) => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            id: crypto.randomUUID(),
            title,
            entity,
            entityId: String(entityId),
            fragment: "",
          },
        },
        " ", // add a space after the mention
      ]);
    }
  };
}

export const getMentionMenuItems = async (): Promise<DefaultReactSuggestionItem[]> => {
  const [documents, tables, users] = await Promise.all([
    DocumentsApi.index({query: { mention: true }}),
    TablesApi.index({query: { mention: true }}),
    UsersApi.index({query: { mention: true }})
  ]);

  // Titles no longer carry the emoji, so without the icon the menu would have
  // lost it entirely. Users get a glyph too, or the rows would not line up.
  const documentMenuItems = documents.map((document: Document) =>
    createMentionItem("document", document.id, document.title, <ObjectIcon type="Document" icon={document.icon}/>));
  const tableMenuItems = tables.map((table: Table) =>
    createMentionItem("table", table.id, table.name, <ObjectIcon type="Table" icon={table.icon}/>));
  const userMenuItems = users.map((user: User) =>
    createMentionItem("user", user.id, `${user.firstName} ${user.lastName}`,
      <span className="object-icon"><i className="fa-regular fa-user"/></span>));

  const menuItems = [...documentMenuItems, ...tableMenuItems, ...userMenuItems];
  return menuItems;
};
import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document, Table, User} from "../../../types.ts";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";
import schema from "../schema.ts";

function createMentionItem(entity, entityId, title) {
  return {
    // TODO: Change SuggestionMenu.tsx in blocknote to use - key: `${entity}/${id}`,
    title,
    onItemClick: (editor: typeof schema.BlockNoteEditor) => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            id: crypto.randomUUID(),
            title,
            entity,
            entityId,
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

  const documentMenuItems = documents.map((document: Document) => createMentionItem("document", document.npi, document.title));
  const tableMenuItems = tables.map((table: Table) => createMentionItem("table", table.npi, table.name));
  const userMenuItems = users.map((user: User) => createMentionItem("user", user.id, `${user.firstName} ${user.lastName}`));

  const menuItems = [...documentMenuItems, ...tableMenuItems, ...userMenuItems];
  return menuItems;
};
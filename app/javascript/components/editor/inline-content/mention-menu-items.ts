import {DefaultReactSuggestionItem} from "@blocknote/react";
import {Document, Table, User} from "../../../types.ts";
import DocumentsApi from "../../../api/DocumentsApi.js";
import UsersApi from "../../../api/UsersApi.js";
import TablesApi from "../../../api/Tables/TablesApi";

function createMentionItem(entity, id, title ) {
  return {
    title,
    onItemClick: (editor) => {
      editor.insertInlineContent([
        {
          type: "mention",
          props: {
            title,
            id,
            entity,
          },
        },
        " ", // add a space after the mention
      ]);
    }
  };
}

export const getMentionMenuItems = async (): Promise<DefaultReactSuggestionItem[]> => {
  const [documents, tables, users] = await Promise.all([
    DocumentsApi.index(),
    TablesApi.index(),
    UsersApi.index()
  ]);

  const documentMenuItems = documents.map((document: Document) => createMentionItem("document", document.id, document.title));
  const tableMenuItems = tables.map((table: Table) => createMentionItem("table", table.npi, table.name));
  const userMenuItems = users.map((user: User) => createMentionItem("user", user.id, `${user.firstName} ${user.lastName}`));

  const menuItems = [...documentMenuItems, ...tableMenuItems, ...userMenuItems];
  return menuItems;
};
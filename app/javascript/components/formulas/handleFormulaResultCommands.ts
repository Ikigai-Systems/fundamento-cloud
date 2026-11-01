import queryClient from "../../contextes/ReactQueryClient.tsx";
import {publishContentUpdate} from "../../content_updated.ts";
import type {ColorName, ObjectIcon, Space} from "../../types.ts";

// What UpdateDocument / UpdateTable stored, which can differ from what the formula passed.
type StoredLabels = {id: string, title: string, icon: ObjectIcon | null, color: ColorName | null};
type FormulaCommand = {type: string, tableId?: string, updated?: StoredLabels};
type FormulaResult = {result: unknown, commands?: FormulaCommand[]};

export default (formulaResult: FormulaResult, space: Space | undefined) => {
  const tableIdsToInvalidate: Record<string, boolean> = {};

  formulaResult.commands?.forEach(command => {
    switch(command.type) {
      case "AddRow":
        tableIdsToInvalidate[command.tableId!] = true;
        // todo: show flash message about performed actions, in this case "1 row added" ?
        break;
      case "DeleteRows":
        tableIdsToInvalidate[command.tableId!] = true;
        // todo: show flash message about performed actions, in this case "X rows removed" ? backend (formula_eval_gateway) could provide that number...
        break;
      case "AddOrUpdateRows":
      case "UpdateRows":
        tableIdsToInvalidate[command.tableId!] = true;
        break;
      case "UpdateDocument":
      case "UpdateTable":
        // The sidebar, the page title and the color picker all follow this one announcement.
        if (command.updated) {
          const {id, title, icon, color} = command.updated;
          publishContentUpdate({id, title, icon, color});
        }
        break;
    }
  });

  Object.keys(tableIdsToInvalidate).forEach(tableId => queryClient.invalidateQueries({queryKey: ["tables", space?.id, tableId]}));
};
import queryClient from "../../contextes/ReactQueryClient.tsx";
import {publishContentUpdate} from "../../content_updated.ts";
import type {ColorName, ObjectIcon, Space} from "../../types.ts";

// What UpdateDocument / UpdateTable stored, which can differ from what the formula passed.
type StoredLabels = {
  id: string,
  title: string,
  titleForEditing: string,
  icon: ObjectIcon | null,
  color: ColorName | null,
};
type TableCommand = {type: "AddRow" | "DeleteRows" | "AddOrUpdateRows" | "UpdateRows", tableId: string};
// `updated` is missing when nothing was stored (a dry run).
type LabelCommand = {type: "UpdateDocument" | "UpdateTable", updated?: StoredLabels};
type FormulaCommand = TableCommand | LabelCommand;
type FormulaResult = {result: unknown, commands?: FormulaCommand[]};

export default (formulaResult: FormulaResult, space: Space | undefined) => {
  const tableIdsToInvalidate: Record<string, boolean> = {};

  formulaResult.commands?.forEach(command => {
    switch(command.type) {
      case "AddRow":
        tableIdsToInvalidate[command.tableId] = true;
        // todo: show flash message about performed actions, in this case "1 row added" ?
        break;
      case "DeleteRows":
        tableIdsToInvalidate[command.tableId] = true;
        // todo: show flash message about performed actions, in this case "X rows removed" ? backend (formula_eval_gateway) could provide that number...
        break;
      case "AddOrUpdateRows":
      case "UpdateRows":
        tableIdsToInvalidate[command.tableId] = true;
        break;
      case "UpdateDocument":
      case "UpdateTable":
        // The sidebar, the page title and the color picker all follow this one announcement.
        if (command.updated) {
          publishContentUpdate(command.updated);
        }
        break;
    }
  });

  Object.keys(tableIdsToInvalidate).forEach(tableId => queryClient.invalidateQueries({queryKey: ["tables", space?.id, tableId]}));
};
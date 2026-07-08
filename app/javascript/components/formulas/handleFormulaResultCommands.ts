import queryClient from "../../contextes/ReactQueryClient.tsx";
import {Space} from "../../types.ts";

type FormulaCommand = {type: string, tableId: string};
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
    }
  });

  Object.keys(tableIdsToInvalidate).forEach(tableId => queryClient.invalidateQueries({queryKey: ["tables", space?.id, tableId]}));
};
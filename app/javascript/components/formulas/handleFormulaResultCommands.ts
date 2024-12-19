import queryClient from "../../contextes/ReactQueryClient.tsx";
import {Space} from "../../types.ts";

export default (formulaResult: {result: any, commands: Array<any>}, space: Space | undefined) => {
  const tableIdsToInvalidate: any = {};

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
        tableIdsToInvalidate[command.tableId] = true;
        break;
    }
  });

  Object.keys(tableIdsToInvalidate).forEach(tableId => queryClient.invalidateQueries({queryKey: ["tables", space?.npi, tableId.toString()]}));
};
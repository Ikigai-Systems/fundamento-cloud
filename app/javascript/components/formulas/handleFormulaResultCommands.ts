import queryClient from "../../contextes/ReactQueryClient.tsx";
import {Space} from "../../types.ts";

export default (formulaResult: {result: any, commands: Array<any>}, space: Space | undefined) => {
  const tableNpisToInvalidate: any = {};

  formulaResult.commands?.forEach(command => {
    switch(command.type) {
      case "AddRow":
        tableNpisToInvalidate[command.tableNpi] = true;
        // todo: show flash message about performed actions, in this case "1 row added" ?
        break;
      case "DeleteRows":
        tableNpisToInvalidate[command.tableNpi] = true;
        // todo: show flash message about performed actions, in this case "X rows removed" ? backend (formula_eval_gateway) could provide that number...
        break;
      case "AddOrUpdateRows":
        tableNpisToInvalidate[command.tableNpi] = true;
        break;
    }
  });

  Object.keys(tableNpisToInvalidate).forEach(tableNpi => queryClient.invalidateQueries({queryKey: ["tables", space?.npi, tableNpi]}));
};
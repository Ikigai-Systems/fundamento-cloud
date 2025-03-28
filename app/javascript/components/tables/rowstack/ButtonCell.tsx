import React, {useContext, useState} from "react";
import FormulasApi from "../../../api/FormulasApi";
import handleFormulaResultCommands from "../../formulas/handleFormulaResultCommands.ts";
import createFlash from "../../createFlash.ts";
import CurrentSpaceContext from "../../../contextes/CurrentSpaceContext.tsx";
import Spinner from "../../spinners/Spinner.tsx";

function ButtonCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
  columnConfiguration,
  tableConfiguration,
  rowId,
}) {
  const {space} = useContext(CurrentSpaceContext);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeButtonFormula = async () => {
    try {
      setIsExecuting(true);

      const formula = columnConfiguration?.buttonFormula || undefined;
      if (!formula) {
        return;
      }

      const formulaResult = await FormulasApi.eval({
        data: {
          formula,
          additionalContext: {
            "ThisRow": rowId
          },
          spaceNpi: space?.npi,
        }
      });

      handleFormulaResultCommands(formulaResult, space);

      if (!formulaResult.commands) {
        createFlash({
          type: "error",
          message: formulaResult.error || "Unable to proceed, invalid action"
        });
      }
    } catch (e) {
      createFlash({
        type: "error",
        message: e.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (<>
    <div className="h-8 ml-1 flex flex-row items-center">
      <button className="secondary-button relative items-center block py-1 px-2"
              disabled={isExecuting}
              onClick={executeButtonFormula}
      >
        <span className={isExecuting ? "invisible" : "visible"}>{columnConfiguration?.buttonLabel || "Click me"}</span>
        <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
          {isExecuting && <Spinner size={6}/>}
        </div>
      </button>
    </div>
  </>);
}

export default ButtonCell;
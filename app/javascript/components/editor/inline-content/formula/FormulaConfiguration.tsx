import React, {useState} from "react";
import Select from 'react-select'
import {StateManagerProps} from "react-select/dist/declarations/src/useStateManager";
import SelectButtonSize from "./SelectButtonSize.tsx";
import SelectButtonColor from "./SelectButtonColor.tsx";

function FormulaConfiguration({
  configuration,
  setConfiguration,
}) {
  const [advancedSectionExpanded, setAdvancedSectionExpanded] = useState<boolean>(false);

  const StyledSelect = (props: StateManagerProps) => <Select
    {...props}
    styles={{
      control: (base) => ({
        ...base,
        minHeight: 32,
      }),
      dropdownIndicator: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
      }),
      clearIndicator: (base) => ({
        ...base,
        paddingTop: 0,
        paddingBottom: 0,
      }),
      group: (base) => ({
        ...base,
        borderBottom: "solid #e2e8f0 1px",
      }),
      menu: (base) => ({
        ...base,
        width: "calc(100% - 16px)",
      }),
      input: (base) => ({
        ...base,
        "input:focus": {
          boxShadow: "none",
        }
      }),
    }}
  />

  return (<>
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px] min-w-[300px]">
      <div className="p-2 pt-4 uppercase font-medium text-xs dark:text-slate-800">
        Formula settings
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col px-2 border-b py-1">
          <textarea className="bg-white rounded p-2 px-2 border mb-1 min-w-96 h-10 min-h-10 placeholder-neutral-400 dark:text-slate-800"
            value={configuration.formula}
            placeholder="Add formula"
            onChange={(e) => {
              setConfiguration({...configuration, ...{formula: e.target.value}});
            }}
          />
        </div>
      </div>
    </div>
  </>);
}

export default FormulaConfiguration;
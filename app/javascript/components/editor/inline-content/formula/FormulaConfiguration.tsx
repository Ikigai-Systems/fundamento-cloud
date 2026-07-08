import React from "react";

function FormulaConfiguration({
  configuration,
  setConfiguration,
}) {
  return (<>
    <div className="border rounded text-sm max-w-[400px] min-w-[300px] dark:!bg-gray-700 dark:border-gray-600">
      <div className="p-2 pt-4 uppercase font-medium text-xs">
        Formula settings
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col px-2 border-b py-1">
          <textarea className="bg-white dark:!bg-gray-800 rounded p-2 px-2 border mb-1 min-w-96 h-10 min-h-10 placeholder-neutral-400 dark:placeholder-gray-400"
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
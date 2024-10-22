import React, {useEffect, useState, useRef} from "react";

function EditFormulaPopup({
  column,
  setColumn,
  close,
}) {
  const [formula, setFormula] = useState<string>(column.fundamentoFormula || "")

  const componentWillUnmount = useRef(false);
  const saveFormulaUponClose = useRef(true);
  useEffect(() => {
    return () => {
      componentWillUnmount.current = true;
    }
  }, []);
  useEffect(() => {
    return () => {
      if (componentWillUnmount.current && saveFormulaUponClose.current) {
        if ((column.fundamentoFormula || "") !== formula) {
          setColumn({fundamentoFormula: formula});
        }
      }
    }
  }, [formula, setColumn]);

  return (
    <div className="shadow-md border rounded rounded-2 text-sm bg-header">
      <div className="p-2 font-bold">
        Column formula
      </div>
      <div className="px-2 py-0 border-b">
        <textarea
          className="focus:outline-none focus:ring rounded rounded-2 p-1 border mb-2 min-w-96 h-32"
          value={formula}
          onBlur={async (e) => {
            if (e.target.value !== column.options?.formula) {
              console.log(`Formula blurred with value changed to ${e.target.value}, shall we do something with it?`);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              saveFormulaUponClose.current = false;
              close();
            }
          }}
          onChange={(e) => {
            setFormula(e.target.value);
          }}
        />
      </div>
      <div className="flex flex-row items-center pl-2 py-1">
        <div className="flex-grow">
          <div>
            = output preview (mockup)
          </div>
        </div>
        <div className="flex flex-row items-center">
          <div className="border-l ml-2 px-2">
            Row 1 of 4
          </div>
          <div className="flex items-center justify-center size-6 hover:bg-neutral-200 active:bg-neutral-300" title="mockup, work in progress">
            <div className="size-4 icon-[heroicons--chevron-up]"></div>
          </div>
          <div className="flex items-center justify-center size-6 hover:bg-neutral-200 active:bg-neutral-300" title="mockup, work in progress">
            <div className="size-4 icon-[heroicons--chevron-down]"></div>
          </div>
          <div className="flex items-center justify-center size-6 mr-2 hover:bg-neutral-200 active:bg-neutral-300" title="mockup, work in progress">
            <div className="size-4 icon-[heroicons--arrows-pointing-out]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditFormulaPopup;
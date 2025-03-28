import React, {useEffect, useRef, useState} from "react";
import Select from 'react-select'
import {StateManagerProps} from "react-select/dist/declarations/src/useStateManager";


function EditButtonPopup({
  column,
  setColumn,
  close,
  rows,
  table,
}) {
  const [formula, setFormula] = useState<string>(column.configuration?.buttonFormula || "");
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
        if ((column.configuration?.buttonFormula || "") !== formula) {
          setColumn({configuration: {...column.configuration, ...{buttonFormula: formula}}});
        }
      }
    }
  }, [formula, setColumn, column.fundamentoFormula]);

  return (<>
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px] min-w-[300px]">
      <div className="p-2 pt-4 uppercase font-medium text-secondary text-xs">
        Button settings
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col py-2 px-2">
          <label className="mt-2 text-xs">On click</label>

          <div className="py-0 border-b">
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
        </div>
        <div className="flex flex-col py-2 px-2 border-b">
          {/*<div className="font-medium text-secondary text-sm">Visual</div>*/}
          <label className="mt-2 text-xs">Label</label>
          <input className="rounded border h-8 p-2" onChange={async (e) => {
            setColumn({configuration: {...column.configuration, ...{buttonLabel: e.target.value}}});
          }}/>
        </div>
      </div>
    </div>
  </>);
}

export default EditButtonPopup;
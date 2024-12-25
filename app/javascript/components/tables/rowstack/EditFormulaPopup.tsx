import React, {useEffect, useState, useRef} from "react";
import Spinner from "../../spinners/Spinner.tsx";
import TablesApi from "../../../api/Tables/TablesApi.js";

function EditFormulaPopup({
  column,
  setColumn,
  close,
  rows,
  space,
  table,
}) {
  const [formula, setFormula] = useState<string>(column.fundamentoFormula || "")
  const [previewRow, setPreviewRow] = useState<number>(0);
  const [previewIsLoading, setPreviewIsLoading] = useState<boolean>(false);
  const [previewResponse, setPreviewResponse] = useState({
    result: undefined,
    error: undefined,
  })

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
  }, [formula, setColumn, column.fundamentoFormula]);

  useEffect(() => {
    const fetchPreview = async () => {
      setPreviewIsLoading(true);
      setPreviewResponse({result: undefined, error: undefined});
      try {
        const response = await TablesApi.previewFormula({params: {npi: table.npi}, data: {formula, rowId: rows[previewRow].id}});
        setPreviewResponse(response);
      } finally {
        setPreviewIsLoading(false);
      }
    }

    fetchPreview();
  }, [formula, previewRow, rows, space.npi, table.id]);

  return (
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px]">
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
      <div className="flex flex-row items-center pl-2 py-1 border-b">
        <div className="flex-grow">
          <div>
            {previewIsLoading && <Spinner size={4}/>}
            {!previewIsLoading && !previewResponse.error && '= ' + previewResponse.result}
            {!previewIsLoading && previewResponse.error && <span className="text-red-600">{previewResponse.error}</span>}
          </div>
        </div>
        <div className="flex flex-row items-center">
          <div className="border-l ml-2 px-2">
            Row {1 + previewRow} of {rows.length}
          </div>
          <div className="flex items-center justify-center size-6 hover:bg-neutral-200 active:bg-neutral-300"
            onClick={() => {
              setPreviewRow(previewValue => (previewValue + 1) % rows.length);
            }}
          >
            <div className="size-4 icon-[heroicons--chevron-down]"></div>
          </div>
          <div className="flex items-center justify-center size-6 hover:bg-neutral-200 active:bg-neutral-300"
            onClick={() => {
              setPreviewRow(previewRow => (rows.length + previewRow - 1) % rows.length);
            }}
          >
            <div className="size-4 icon-[heroicons--chevron-up]"></div>
          </div>
          <div className="flex items-center justify-center size-6 mr-2 hover:bg-neutral-200 active:bg-neutral-300"
            title="mockup, work in progress"
          >
            <div className="size-4 icon-[heroicons--arrows-pointing-out]"></div>
          </div>
        </div>
      </div>
      {formula.match(/CurrentRow.*".*"/) && <div className="flex flex-row items-center p-2 gap-2">
        <div className="min-w-6 min-h-6 icon-[heroicons--exclamation-triangle]"></div>
        <div>
          Formulas depending on other cells require full page refresh after editing those cells to see up-to-date table
          values.
        </div>
      </div>}
    </div>
  );
}

export default EditFormulaPopup;
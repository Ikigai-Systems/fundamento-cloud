import React, {useEffect, useRef} from "react";

const formats = [[
  "0.01",
  "0,01"
]];

function EditDateDisplayFormatPopup({
  column,
  setColumn,
  close,
}) {
  const selectedDivRef = useRef();

  useEffect(() => {
    const {current} = selectedDivRef;
    if (current) {
      (current as HTMLElement).scrollIntoView({behavior: "smooth", block: "nearest"});
    }
  }, []);

  return (
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px]">
      <div className="p-2 pt-4 uppercase font-medium text-secondary text-xs">
        Stored format
      </div>
      <div className="h-full overflow-y-auto">
        {formats.map((formatGroup, index) => (
          <div key={index} className="border-b py-1">
            {formatGroup.map((format, index) => {
              const isSelected = (column.configuration?.numberStoredFormat) === format;

              return (
                <div key={index} ref={isSelected ? selectedDivRef : undefined} className={`rs-btn w-full px-3 py-1 flex items-center cursor-default${isSelected ? " bg-blue-500 text-inverted hover:bg-blue-500": " hover:bg-hover-light"}`}
                  onClick={() => {
                    setColumn({configuration: {...column.configuration, ...{numberStoredFormat: format}}});
                    close();
                  }}
                >
                  {format}
                </div>
              )})}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EditDateDisplayFormatPopup;
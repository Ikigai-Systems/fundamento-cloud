import React, {useEffect, useRef} from "react";

const formats = [[
  "1/31/2024",
],[
  "31/01/2024",
  "31.01.2024",
],[
  "2024-01-31",
]];

function EditDateStoredFormatPopup({
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
              let optionIndex = 0;
              for (const fg of formats) {
                if (fg.includes(format)) {
                  optionIndex += fg.indexOf(format);
                  break;
                } else {
                  optionIndex += fg.length;
                }
              }

              const isSelected = (column.configuration?.dateStoredFormat || 0) === optionIndex;

              return (
                <div key={index} ref={isSelected ? selectedDivRef : undefined} className={`rs-btn w-full px-3 py-1 flex items-center cursor-default${isSelected ? " bg-blue-500 text-inverted hover:bg-blue-500": " hover:bg-hover-light"}`}
                  onClick={() => {
                    setColumn({configuration: {...column.configuration, ...{dateStoredFormat: optionIndex}}});
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

export default EditDateStoredFormatPopup;
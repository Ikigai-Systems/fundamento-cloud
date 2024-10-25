import React, {useRef, useEffect} from "react";

const formats = [[
  "1/31/2024",
  "1/31/24",
  "1/31",
],[
  "January 31, 2024",
  "Jan 31, 2024",
  "Jan 31",
  "Wed, Jan 31",
  "Wed, Jan 31, 2024"
],[
  "31/01/2024",
  "31.01.2024",
  "31.01",
],[
  "2024-01-31",
],[
  "January 2024",
  "Wednesday",
  "31",
  "January",
  "2024",
  "Jan 2024"
]];

function EditDateFormatPopup({
  column,
  setColumn,
  close,
  rows,
  table,
}) {
  const selectedDivRef = useRef();

  useEffect(() => {
    const {current} = selectedDivRef;
    if (current !== null) {
      current.scrollIntoView({behavior: "smooth"});
    }
  }, []);

  return (
    <div className="shadow-md border rounded rounded-2 text-sm bg-header max-w-[400px]">
      <div className="p-2 pt-4 uppercase font-medium text-secondary text-xs">
        Date format
      </div>
      <div className="h-64 overflow-y-scroll">
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

              const isSelected = (column.configuration?.dateFormat || 0) === optionIndex;

              return (
                <div key={index} ref={isSelected ? selectedDivRef : undefined} className={`rs-btn w-full px-3 py-1 flex items-center cursor-default${isSelected ? " bg-blue-500 text-inverted hover:bg-blue-500": " hover:bg-hover-light"}`}
                  onClick={() => {
                    console.log({configuration: {...column.configuration, ...{dateFormat: optionIndex}}});
                    setColumn({configuration: {...column.configuration, ...{dateFormat: optionIndex}}});
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

export default EditDateFormatPopup;
import React from "react";

function DateTimeCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
}) {
  return (<>
    <div className="h-8 flex flex-row items-center">
      {focusState === "none" && (
        <div>
          {data} {focusState}
        </div>
      )}
      {(focusState === "focused" || focusState === "editing") && (<>
        {(focusState === "focused") && (
          <div className="h-full w-full flex flex-row items-center"
            onClick={() => setFocus("editing")}>
            {data} {focusState}
          </div>
        )}
        {(focusState === "editing") && (
          <input autoFocus aria-label="Date and time" type="datetime-local" className="h-full w-full"/>
        )}
      </>)}
    </div>
  </>);
}

export default DateTimeCell;

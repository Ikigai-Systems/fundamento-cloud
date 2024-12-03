import dayjs from "dayjs";
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
          {data}
        </div>
      )}
      {(focusState === "focused" || focusState === "editing") && (<>
        {(focusState === "focused") && (
          <div className="h-full w-full flex flex-row items-center"
            onClick={() => setFocus("editing")}>
            {data}
          </div>
        )}
        {(focusState === "editing") && (
          <input autoFocus aria-label="Date and time" type="datetime-local" className="h-full w-full"
            value={data || dayjs().format("YYYY-MM-DDThh:mm")}
            onChange={(e) => {
              setData(e.target.value);
            }}
          />
        )}
      </>)}
    </div>
  </>);
}

export default DateTimeCell;

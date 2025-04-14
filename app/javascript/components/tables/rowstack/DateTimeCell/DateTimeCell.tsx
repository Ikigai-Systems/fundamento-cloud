import dayjs from "dayjs";
import React from "react";

function DateTimeCell({
  data,
  setData,
  focusState,
  setFocus,
  isViewOnly,
  columnConfiguration,
  tableConfiguration,
}) {
  //todo: convert to useMemo
  let dateChunk = null;
  let timeChunk = null;
  let parsedDate = null;
  if (data != null) {
    parsedDate = tableConfiguration.parseDate(data, columnConfiguration);
    const dayjsDate = dayjs(parsedDate);
    dateChunk = tableConfiguration.formatDisplayDate(parsedDate, columnConfiguration);
    switch (columnConfiguration?.timeDisplayFormat) {
    case "None":
      break;
    case "11:00:00 PM":
      timeChunk = dayjsDate.format("hh:mm:ss A");
      break;
    case "11:00 PM":
      timeChunk = dayjsDate.format("hh:mm A");
      break;
    case "23:00:00":
      timeChunk = dayjsDate.format("HH:mm:ss");
      break;
    case "11:00":
    default:
      timeChunk = dayjsDate.format("HH:mm");
      break;
    }
  }

  return (<>
    <div className="p-1 h-8 flex flex-row w-full">
      {focusState === "none" && (
        <div>
          {dateChunk} {timeChunk}
        </div>
      )}
      {(focusState === "focused" || focusState === "editing") && (<>
        {(focusState === "focused" || isViewOnly) && (
          <div className="w-full flex flex-row">
            {dateChunk} {timeChunk}
          </div>
        )}
        {(focusState === "editing" && !isViewOnly) && (
          <input autoFocus aria-label="Date and time" type="datetime-local" className="h-full w-full focus:ring-0 dark:bg-gray-800"
            value={dayjs(parsedDate).format("YYYY-MM-DDThh:mm")}
            onChange={(e) => {
              const storedDate = tableConfiguration.formatStoredDate(e.target.value, columnConfiguration);
              const storedTime = dayjs(e.target.value).format("hh:mm");
              setData(`${storedDate} ${storedTime}`);
            }}
          />
        )}
      </>)}
    </div>
  </>);
}

export default DateTimeCell;

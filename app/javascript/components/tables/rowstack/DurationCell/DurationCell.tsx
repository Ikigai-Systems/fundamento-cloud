import {useEffect, useRef} from "react";
import {normalizeDuration} from "../../../../utils/duration.ts";

type FocusState = "none" | "focused" | "editing";

type DurationCellProps = {
  data: string | null;
  setData: (value: string) => void;
  focusState: FocusState;
  isViewOnly: boolean;
};

// The cell stores canonical text ("1 hr 30 mins"). What the user types is kept as typed
// while editing and normalized when they leave the cell; text that is not a duration is
// kept as typed and shown as invalid.
function DurationCell({data, setData, focusState, isViewOnly}: DurationCellProps) {
  const wasEditing = useRef(false);

  useEffect(() => {
    if (wasEditing.current && focusState !== "editing" && data) {
      const canonical = normalizeDuration(data);
      if (canonical !== null && canonical !== data) {
        setData(canonical);
      }
    }
    wasEditing.current = focusState === "editing";
  }, [focusState]); // eslint-disable-line react-hooks/exhaustive-deps

  const isInvalid = !!data && normalizeDuration(data) === null;

  if (focusState === "editing" && !isViewOnly) {
    return (
      <input
        autoFocus
        aria-label="Duration"
        placeholder="e.g. 1h 30m, 5:30, 2 days"
        className="h-8 w-full p-1 focus:ring-0 dark:bg-gray-800"
        value={data ?? ""}
        onChange={(e) => setData(e.target.value)}
      />
    );
  }

  return (
    <div
      className={`p-1 h-8 w-full truncate${isInvalid ? " text-red-500" : ""}`}
      title={isInvalid ? "Not a duration, try 1h 30m, 5:30 or 2 days" : undefined}
    >
      {data}
    </div>
  );
}

export default DurationCell;

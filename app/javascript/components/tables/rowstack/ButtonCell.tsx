import React from "react";

function ButtonCell({
  data,
  setData,
  focusState,
  setFocus,
}) {
  return (<>
    <div className="h-8 flex flex-row items-center">
      {focusState === "none" && (
        <div>
          {focusState}
        </div>
      )}
      {(focusState === "focused" || focusState === "editing") && (
        <div className="h-full w-full flex flex-row items-center" onClick={() => setFocus("editing")}>
          {focusState}
        </div>
      )}
    </div>
  </>);
}

export default ButtonCell;
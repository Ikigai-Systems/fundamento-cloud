type BlockTitleProps = {
  key: string,
  defaultValue: string,
  onChange?: (value: string) => Promise<void>,
}

export const BlockTitle = ({defaultValue, onChange}: BlockTitleProps) => {
  return <input
    // key={key}
    type="text"
    placeholder={"Placeholder"}
    defaultValue={defaultValue}
    // className={`content-title-input${extraClasses ? ` ${extraClasses}` : ""}`}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        if (e.target instanceof HTMLElement) {
          e.target.blur();
        }
      } else if (e.key === "Escape") {
        if (e.target instanceof HTMLInputElement) {
          e.target.value = defaultValue;
          e.target.blur();
        }
      }
    }}
    onBlur={async (e) => {
      const newName = e.target.value;
      if (newName !== defaultValue && onChange !== undefined) {
        await onChange(e.target.value);
      }
    }}
  >
  </input>;
}
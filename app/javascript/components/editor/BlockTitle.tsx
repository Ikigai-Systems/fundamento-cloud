type BlockTitleProps = {
  defaultValue: string,
  onChange?: (value: string) => Promise<void>,
  placeholder?: string,
  isEditable?: boolean,
}

export const BlockTitle = ({defaultValue, onChange, placeholder, isEditable = true}: BlockTitleProps) => {
  return !isEditable ? (
    <div className="text-xl font-bold min-h-0 max-h-6 mb-1 p-0">
      {defaultValue}
    </div>
  ) : (
    <input
      type="text"
      disabled={!isEditable}
      placeholder={placeholder || "Untitled"}
      defaultValue={defaultValue}
      className="text-xl font-bold min-h-0 max-h-6 mt-0 p-0 mb-1 border-0 focus:[box-shadow:none]"
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
    />
  );
}
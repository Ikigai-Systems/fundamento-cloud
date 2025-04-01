import React, { useState, useRef, useEffect, forwardRef } from "react";
import {
  useFloating,
  useInteractions,
  useListNavigation,
  useClick,
  useDismiss,
  FloatingFocusManager,
  FloatingPortal,
  useRole,
  offset,
  flip,
  autoUpdate,
  useId,
  shift
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import {colorNameToClass} from "./buttonColorUtils.ts";

const colors = [
  {
    name: "green",
  },
  {
    name: "orange",
  },
  {
    name: "blue",
  },
  {
    name: "yellow",
  },
  {
    name: "red",
  },
  {
    name: "black",
  },
  {
    name: "white",
  },
  {
    name: "pink",
  },
  {
    name: "violet",
  }
];

type OptionProps = React.HTMLAttributes<HTMLDivElement> & {
  name: string;
  active: boolean;
  selected: boolean;
  children: React.ReactNode;
};

const Option = forwardRef<HTMLDivElement, OptionProps>(function Option(
  { name, active, selected, children, ...props },
  ref
) {
  const id = useId();
  return (
    <div
      {...props}
      ref={ref}
      id={id}
      role="option"
      aria-selected={selected}
      className={`cursor-pointer flex flex-row items-center text-center size-8 ${active ? "ring-2 ring-inset ring-gray-300" : ""}`}
    >
      <div className={`rounded text-center size-6 ${colorNameToClass(name)} font-bold m-1`}>
        A
      </div>
    </div>
  );
});

export default function SelectButtonColor({
  value, onChange
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(value);

  useEffect(() => {
    onChange(selectedColor);
  }, [selectedColor]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const listRef = useRef<Array<HTMLElement | null>>([]);

  const noResultsId = useId();
  const buttonId = useId();
  const listboxId = useId();

  const {
    refs,
    floatingStyles,
    context,
  } = useFloating({
    placement: "bottom-start" as Placement,
    open,
    onOpenChange: setOpen,
    middleware: [offset(4), flip(), shift()],
    whileElementsMounted: autoUpdate
  });

  // Handles opening the floating element via the Choose Emoji button.
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context)
  ]);

  // Handles the list navigation where the reference is the inner input, not
  // the button that opens the floating element.
  const {
    getReferenceProps: getInputProps,
    getFloatingProps: getListFloatingProps,
    getItemProps
  } = useInteractions([
    useListNavigation(context, {
      listRef,
      onNavigate: open ? setActiveIndex : undefined,
      activeIndex,
      cols: 3,
      orientation: "horizontal",
      loop: true,
      focusItemOnOpen: false,
      virtual: true,
      allowEscape: true
    })
  ]);

  const handleColorClick = (index: number) => {
    setSelectedColor(colors[index].name);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && activeIndex !== null) {
      event.preventDefault();
      handleColorClick(activeIndex);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveIndex(null);
    setSearch(event.target.value);
  };

  // Prevent input losing focus on Firefox VoiceOver
  const {
    "aria-activedescendant": ignoreAria,
    ...floatingProps
  } = getFloatingProps(getListFloatingProps());

  return (
    <>
      <label className="mt-3 text-xs" onClick={() => refs.domReference.current?.focus()}>Color</label>
      <div
        tabIndex={0}
        ref={refs.setReference}
        className="bg-white dark:!bg-gray-800 h-8 w-32 pr-2 pl-1 flex flex-row items-center justify-between rounded-lg text-sm"
        {...getReferenceProps()}
      >
        {selectedColor && <div className={`rounded flex items-center justify-center size-6 ${colorNameToClass(selectedColor)} font-bold m-1`}>
          A
        </div>}
        {!selectedColor && "Select..."}
        <span className="p-2 icon-[heroicons--chevron-down]"/>
      </div>
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              aria-labelledby={buttonId}
              {...floatingProps}
            >
              {colors.length > 0 && (
                <div
                  className="grid grid-cols-3 rounded bg-white dark:!bg-gray-800 border shadow"
                  role="listbox"
                  id={listboxId}
                >
                  {colors.map(({name, color}, index) => (
                    <Option
                      key={name}
                      name={name}
                      ref={(node) => {
                        listRef.current[index] = node;
                      }}
                      selected={selectedColor === color}
                      active={activeIndex === index}
                      {...getItemProps({
                        onClick: () => handleColorClick(index)
                      })}
                    >
                      {color}
                    </Option>
                  ))}
                </div>
              )}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </>
  );
}

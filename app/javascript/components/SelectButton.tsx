import React, {useEffect, useRef, useState} from "react";
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from "@floating-ui/react";
import {Placement} from "@floating-ui/utils";

type OptionOrString = string | {value: string, label: string}

type SelectButtonProps = {
  value: string,
  onChange?: (value: OptionOrString) => Promise<void>,
  options: OptionOrString[],
}

export default function SelectButton({
  value, onChange, options
}: SelectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(options.findIndex(option => (option?.value || option) === value));

  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current === true) {
      initialRender.current = false;
    } else {
      onChange(options[selectedIndex]);
    }
  }, [selectedIndex]);

  const { refs, floatingStyles, context } = useFloating<HTMLElement>({
    placement: "bottom-start" as Placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  const listRef = useRef<Array<HTMLElement | null>>([]);
  const listContentRef = useRef(options);
  const isTypingRef = useRef(false);

  const click = useClick(context, { event: "mousedown" });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    // This is a large list, allow looping.
    loop: true,
  });
  const typeahead = useTypeahead(context, {
    listRef: listContentRef,
    activeIndex,
    selectedIndex,
    onMatch: isOpen ? setActiveIndex : setSelectedIndex,
    onTypingChange(isTyping) {
      isTypingRef.current = isTyping;
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [dismiss, role, listNav, typeahead, click]
  );

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(false);
  };

  const selectedItemLabel =
    selectedIndex !== null ? options[selectedIndex]?.label || options[selectedIndex] : undefined;

  return (
    <>
      <div
        tabIndex={0}
        ref={refs.setReference}
        className="border h-8 w-32 px-2 flex flex-row items-center justify-between rounded-lg text-sm"
        {...getReferenceProps()}
      >
        {selectedItemLabel || "Select..."}
        <span className="p-2 icon-[heroicons--chevron-down]"/>
      </div>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              className="shadow-xl bg-white overflow-y-auto border-solid border py-2 rounded-lg z-20"
              style={{
                ...floatingStyles,
              }}
              {...getFloatingProps()}
            >
              {options.map((option, i) => (
                <div
                  key={option?.value || option}
                  ref={(node) => {
                    listRef.current[i] = node;
                  }}
                  role="option"
                  tabIndex={i === activeIndex ? 0 : -1}
                  aria-selected={i === selectedIndex && i === activeIndex}
                  className={`p-2 h-8 flex flex-row items-center text-sm cursor-pointer${i === activeIndex ? " bg-neutral-100" : ""}`}
                  {...getItemProps({
                    // Handle pointer select.
                    onClick() {
                      handleSelect(i);
                    },
                    // Handle keyboard select.
                    onKeyDown(event) {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSelect(i);
                      }

                      if (event.key === " " && !isTypingRef.current) {
                        event.preventDefault();
                        handleSelect(i);
                      }
                    },
                  })}
                >
                  {option?.label || option}
                </div>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

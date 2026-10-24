// One spinner glyph for every loading state, so they all look alike. Pass the size as a
// complete Tailwind class; the default suits a line of text next to a label.
export const SpinnerIcon = ({className = "size-5"}: {className?: string}) => (
  <span className={`icon-[tabler--loader-2] animate-spin shrink-0 ${className}`} aria-hidden="true"/>
);

// Tailwind only sees complete class names, so the supported sizes are spelled out.
const SIZE_CLASSES: Record<number, string> = {4: "size-4", 6: "size-6", 8: "size-8"};

const Spinner = ({size = 8}) => {
  return (
    <div role="status">
      <SpinnerIcon className={`${SIZE_CLASSES[size] ?? "size-8"} text-gray-400 dark:text-gray-500`}/>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;

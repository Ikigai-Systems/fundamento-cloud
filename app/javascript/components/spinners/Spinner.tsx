// One spinner glyph for every loading state, so they all look alike. Pass the size as a
// complete Tailwind class; the default suits a line of text next to a label.
export const SpinnerIcon = ({className = "size-5"}: {className?: string}) => (
  <span className={`icon-[tabler--loader-2] animate-spin shrink-0 ${className}`} aria-hidden="true"/>
);

// Tailwind only sees complete class names, so the supported sizes are spelled out.
const SIZE_CLASSES = {4: "size-4", 6: "size-6", 8: "size-8"} as const;

// The orange accent is the same in light and dark, as the old track-and-arc spinner had it.
const Spinner = ({size = 8}: {size?: keyof typeof SIZE_CLASSES}) => {
  return (
    <div role="status">
      <SpinnerIcon className={`${SIZE_CLASSES[size]} text-primary-orange-600`}/>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;

import {ObjectIcon as ObjectIconValue} from "../types.js";

export type ObjectType = "Document" | "Table" | "Space";

// Mirrors ObjectIcon::FALLBACK_ICON_CLASSES in app/components/object_icon.rb.
// Three class strings of pure presentation config; plumbing them through the
// server would cost more than keeping the two lists in step.
const FALLBACK_GLYPHS: Record<ObjectType, string> = {
  Document: "fa-regular fa-file-lines",
  Table: "fa-regular fa-table",
  Space: "fa-sharp fa-regular fa-space-station-moon",
};

type ObjectIconProps = {
  type: ObjectType;
  icon?: ObjectIconValue | null;
  // Inline contexts -- a mention sitting inside a sentence -- want the icon or
  // nothing at all. A generic file glyph mid-paragraph is noise, not meaning.
  fallback?: boolean;
};

// The React counterpart of the ObjectIcon view component. Same markup, same
// class, so a row rendered by Rails and a row rendered by React line up.
const ObjectIcon = ({type, icon, fallback = true}: ObjectIconProps) => {
  if (!icon && !fallback) return null;

  return (
    <span className="object-icon" aria-hidden="true">
      {icon ? icon.value : <i className={FALLBACK_GLYPHS[type]}/>}
    </span>
  );
};

export default ObjectIcon;

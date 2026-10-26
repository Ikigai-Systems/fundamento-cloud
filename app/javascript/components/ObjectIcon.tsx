import {ObjectIcon as ObjectIconValue} from "../types.js";

export type ObjectType = "Document" | "Table" | "Space";

// Mirrors ObjectIcon::FALLBACK_ICON_CLASSES in app/components/object_icon.rb.
// Three class strings of pure presentation config; plumbing them through the
// server would cost more than keeping the two lists in step.
const FALLBACK_GLYPHS: Record<ObjectType, string> = {
  Document: "icon-[tabler--file-text]",
  Table: "icon-[tabler--table]",
  Space: "icon-[tabler--planet]",
};

type ObjectIconProps = {
  type: ObjectType;
  icon?: ObjectIconValue | null;
  // A title the user edits wants the icon or nothing at all: a generic glyph
  // in front of it would read as part of what they typed.
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

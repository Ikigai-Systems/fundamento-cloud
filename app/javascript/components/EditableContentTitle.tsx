import {useState, useRef, useEffect} from "react";
import {Document, ObjectIcon as ObjectIconValue, Table} from "../types.js";
import ObjectIcon, {ObjectType} from "./ObjectIcon.tsx";
import createFlash from "../utils/createFlash.ts";
import DocumentsApi from "../api/DocumentsApi.js";
import TablesApi from "../api/Tables/TablesApi.js";

export const UNTITLED_CONTENT = "Untitled";

type RenameResponse = {
  title?: string;
  name?: string;
  icon?: ObjectIconValue | null;
  titleForEditing?: string;
};

// A saved title is not necessarily the title that was typed: the server splits a
// leading emoji off into the icon. Everything downstream therefore reads the
// response rather than the input, which is why no code on this side needs to
// know what an emoji is.
//
// Returns the split the server settled on; the sidebar gets the same thing
// through the event.
export type RenameResult = {
  title: string;
  icon: ObjectIconValue | null;
  titleForEditing: string;
};

function announceRename(id: string, response: RenameResponse, typedTitle: string): RenameResult {
  const title = response.title ?? response.name ?? typedTitle;
  const icon = response.icon ?? null;

  window.dispatchEvent(new CustomEvent("content-title-updated", {detail: {id, title, icon}}));

  return {title, icon, titleForEditing: response.titleForEditing ?? title};
}

// Shared helper exported alongside the component; imported elsewhere, so it stays here despite fast-refresh.
// eslint-disable-next-line react-refresh/only-export-components
export async function saveTableTitle(tableId: string, name: string): Promise<RenameResult> {
  const response = await TablesApi.update({
    params: {id: tableId},
    data: {name},
  }) as RenameResponse;

  return announceRename(tableId, response, name);
}

// Shared helper exported alongside the component; imported elsewhere, so it stays here despite fast-refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function handleTitleSaveError(e: unknown, fallbackMessage?: string): void {
  const err = e as {response?: {data?: {errors?: Record<string, string>}}};
  const errorMessage = err.response?.data?.errors
    ? Object.entries(err.response.data.errors).map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)} ${value}`).join("<br/>")
    : (fallbackMessage || "Failed to update the title, please reload page and try again.");
  createFlash({type: "error", message: errorMessage});
}

type EditableContentTitleProps = {
  editable: boolean;
} & (
  | {contentType: "document"; document: Document}
  | {contentType: "table"; table: Table}
);

const contentOf = (props: EditableContentTitleProps) =>
  props.contentType === "document" ? props.document : props.table;

const objectTypeOf = (props: EditableContentTitleProps): ObjectType =>
  props.contentType === "document" ? "Document" : "Table";

// What the heading shows: the icon in its own slot, then the plain title.
const getDisplayTitle = (props: EditableContentTitleProps): string => {
  const content = contentOf(props);
  return ("title" in content ? content.title : content.name) || UNTITLED_CONTENT;
};

// What the input holds. The icon goes back on the front while editing, because
// the title field is still the only way to set one -- binding the input to the
// stripped title would hide the icon and then clear it on save.
const getEditingTitle = (props: EditableContentTitleProps): string =>
  contentOf(props).titleForEditing || getDisplayTitle(props);

const EditableContentTitle = (props: EditableContentTitleProps) => {
  const initialEditingTitle = getEditingTitle(props);
  const [isEditing, setIsEditing] = useState(false);
  const [icon, setIcon] = useState<ObjectIconValue | null>(contentOf(props).icon ?? null);
  const [displayTitle, setDisplayTitle] = useState(getDisplayTitle(props));
  const [title, setTitle] = useState(initialEditingTitle);
  const [originalTitle, setOriginalTitle] = useState(initialEditingTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const save = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    const titleToSave = trimmed || UNTITLED_CONTENT;

    try {
      let saved: RenameResult;

      if (props.contentType === "document") {
        const response = await DocumentsApi.update({
          params: {id: props.document.id},
          data: {title: titleToSave},
        }) as RenameResponse;
        saved = announceRename(props.document.id, response, titleToSave);
      } else {
        saved = await saveTableTitle(props.table.id, titleToSave);
      }

      setIcon(saved.icon);
      setDisplayTitle(saved.title || UNTITLED_CONTENT);
      setTitle(saved.titleForEditing);
      setOriginalTitle(saved.titleForEditing);
    } catch (e: unknown) {
      handleTitleSaveError(e);
      setTitle(originalTitle);
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);
    if (title !== originalTitle) {
      await save(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setTitle(originalTitle);
      setIsEditing(false);
    }
  };

  // fallback={false}: most objects have no icon, and a generic file glyph beside
  // every heading in the app would be noise rather than information.
  const iconSlot = <ObjectIcon type={objectTypeOf(props)} icon={icon} fallback={false}/>;

  if (!props.editable) {
    return (
      <div className="editable-content-title">
        {iconSlot}{displayTitle}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="editable-content-title">
        <input
          ref={inputRef}
          type="text"
          value={title === UNTITLED_CONTENT ? "" : title}
          placeholder={UNTITLED_CONTENT}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  return (
    <div
      className="editable-content-title editable"
      onClick={() => setIsEditing(true)}
    >
      {iconSlot}{displayTitle}
    </div>
  );
};

export default EditableContentTitle;

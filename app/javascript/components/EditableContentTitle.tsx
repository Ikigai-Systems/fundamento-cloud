import {useState, useRef, useEffect} from "react";
import {Document, ObjectIcon, Table} from "../types.js";
import createFlash from "../utils/createFlash.ts";
import DocumentsApi from "../api/DocumentsApi.js";
import TablesApi from "../api/Tables/TablesApi.js";

export const UNTITLED_CONTENT = "Untitled";

type RenameResponse = {
  title?: string;
  name?: string;
  icon?: ObjectIcon | null;
  titleForEditing?: string;
};

// A saved title is not necessarily the title that was typed: the server splits a
// leading emoji off into the icon. Everything downstream therefore reads the
// response rather than the input, which is why no code on this side needs to
// know what an emoji is.
//
// Returns what the edit field should now show; the sidebar gets the split-out
// label and icon through the event.
function announceRename(id: string, response: RenameResponse, typedTitle: string): string {
  const title = response.title ?? response.name ?? typedTitle;

  window.dispatchEvent(new CustomEvent("content-title-updated", {
    detail: {id, title, icon: response.icon ?? null},
  }));

  return response.titleForEditing ?? title;
}

// Shared helper exported alongside the component; imported elsewhere, so it stays here despite fast-refresh.
// eslint-disable-next-line react-refresh/only-export-components
export async function saveTableTitle(tableId: string, name: string): Promise<string> {
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

// The icon is shown as part of the title here, exactly as it was before icons
// were split out of the stored title. Giving the header its own icon slot is a
// separate change; until then this keeps the emoji visible and, more importantly,
// keeps it in the edit field -- editing a title with the emoji already stripped
// away would silently clear the icon on save.
const getTitle = (props: EditableContentTitleProps): string => {
  if (props.contentType === "document") {
    return props.document.titleForEditing || props.document.title || UNTITLED_CONTENT;
  }
  return props.table.titleForEditing || props.table.name || UNTITLED_CONTENT;
};

const EditableContentTitle = (props: EditableContentTitleProps) => {
  const initialTitle = getTitle(props);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [originalTitle, setOriginalTitle] = useState(initialTitle);
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
      let saved: string;

      if (props.contentType === "document") {
        const response = await DocumentsApi.update({
          params: {id: props.document.id},
          data: {title: titleToSave},
        }) as RenameResponse;
        saved = announceRename(props.document.id, response, titleToSave);
      } else {
        saved = await saveTableTitle(props.table.id, titleToSave);
      }

      setTitle(saved);
      setOriginalTitle(saved);
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

  if (!props.editable) {
    return (
      <div className="editable-content-title">
        {title}
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
      {title}
    </div>
  );
};

export default EditableContentTitle;

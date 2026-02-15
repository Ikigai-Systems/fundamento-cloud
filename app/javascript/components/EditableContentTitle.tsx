import {useState, useRef, useEffect} from "react";
import {Document, Table} from "../types.js";
import createFlash from "../utils/createFlash.ts";
import DocumentsApi from "../api/DocumentsApi.js";
import TablesApi from "../api/Tables/TablesApi.js";

export const UNTITLED_CONTENT = "Untitled";

export async function saveTableTitle(tableId: string, name: string): Promise<void> {
  await TablesApi.update({
    params: {id: tableId},
    data: {name},
  });
  window.dispatchEvent(new CustomEvent("content-title-updated", {
    detail: {id: tableId, title: name},
  }));
}

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

const getTitle = (props: EditableContentTitleProps): string => {
  if (props.contentType === "document") {
    return props.document.title || UNTITLED_CONTENT;
  }
  return props.table.name || UNTITLED_CONTENT;
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
      if (props.contentType === "document") {
        await DocumentsApi.update({
          params: {id: props.document.id},
          data: {title: titleToSave},
        });
        window.dispatchEvent(new CustomEvent("content-title-updated", {
          detail: {id: props.document.id, title: titleToSave},
        }));
      } else {
        await saveTableTitle(props.table.id, titleToSave);
      }

      setTitle(titleToSave);
      setOriginalTitle(titleToSave);
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

import {useState, useRef, useEffect} from "react";
import {Document, Table} from "../types.js";
import createFlash from "./createFlash.ts";
import DocumentsApi from "../api/DocumentsApi.js";
import TablesApi from "../api/Tables/TablesApi.js";

export const UNTITLED_CONTENT = "Untitled";

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

const getId = (props: EditableContentTitleProps): string => {
  if (props.contentType === "document") {
    return props.document.id;
  }
  return props.table.id;
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
      } else {
        await TablesApi.update({
          params: {id: props.table.id},
          data: {name: titleToSave},
        });
      }

      setTitle(titleToSave);
      setOriginalTitle(titleToSave);

      window.dispatchEvent(new CustomEvent("content-title-updated", {
        detail: {id: getId(props), title: titleToSave},
      }));
    } catch (e: unknown) {
      const err = e as {response?: {data?: {errors?: Record<string, string>}}};
      const errorMessage = err.response?.data?.errors
        ? Object.entries(err.response.data.errors).map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)} ${value}`).join("<br/>")
        : "Failed to update the title, please reload page and try again.";

      createFlash({type: "error", message: errorMessage});
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

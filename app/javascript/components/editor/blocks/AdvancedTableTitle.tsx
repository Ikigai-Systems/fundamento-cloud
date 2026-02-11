import {useState, useRef, useEffect} from "react";
import {Table} from "../../../types.js";
import {UNTITLED_CONTENT, saveTableTitle, handleTitleSaveError} from "../../EditableContentTitle.tsx";

type AdvancedTableTitleProps = {
  table: Table;
  editable: boolean;
};

const AdvancedTableTitle = ({table, editable}: AdvancedTableTitleProps) => {
  const initialTitle = table.name || UNTITLED_CONTENT;
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
      await saveTableTitle(table.id, titleToSave);
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

  if (!editable) {
    return (
      <div className="advanced-table-title">
        {title}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="advanced-table-title">
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
      className="advanced-table-title editable"
      onClick={() => setIsEditing(true)}
    >
      {title}
    </div>
  );
};

export default AdvancedTableTitle;

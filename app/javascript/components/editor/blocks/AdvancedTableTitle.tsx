import {useState, useRef, useEffect} from "react";
import {Table} from "../../../types.js";
import {UNTITLED_CONTENT, saveTableTitle, handleTitleSaveError} from "../../EditableContentTitle.tsx";

type AdvancedTableTitleProps = {
  table: Table;
  editable: boolean;
};

const AdvancedTableTitle = ({table, editable}: AdvancedTableTitleProps) => {
  const initialTitle = table.titleForEditing || table.name || UNTITLED_CONTENT;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [originalTitle, setOriginalTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  // Escape has to be visible to handleBlur in the same tick. Blur can reach
  // handleBlur before React applies the state update Escape schedules, and the
  // handler would then still see the typed title and save the edit the user
  // just asked to discard. A ref is read synchronously, so it survives that
  // ordering where state does not.
  const escapedRef = useRef(false);

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
      const saved = await saveTableTitle(table.id, titleToSave);
      setTitle(saved.titleForEditing);
      setOriginalTitle(saved.titleForEditing);
    } catch (e: unknown) {
      handleTitleSaveError(e);
      setTitle(originalTitle);
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);
    if (escapedRef.current) {
      escapedRef.current = false;
      return;
    }
    if (title !== originalTitle) {
      await save(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      escapedRef.current = true;
      setTitle(originalTitle);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    // Escape may not be followed by a blur at all, so clear the flag on the way
    // in rather than relying on handleBlur to consume it.
    escapedRef.current = false;
    setIsEditing(true);
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
      onClick={startEditing}
    >
      {title}
    </div>
  );
};

export default AdvancedTableTitle;

import '@blocknote/mantine/style.css';
import "./editor/editor-styles.css";
import {useState} from "react";
import useInterval from "../hooks/useInterval.ts";

type TableOfContentsPanelProps = {
  content: unknown,
}

const TableOfContentsPanel = ({content}: TableOfContentsPanelProps) => {
  const [documentBlocks, setDocumentBlocks] = useState(window.blockNoteEditor?.document || content);

  useInterval(() => {
    if (window.blockNoteEditor) {
      setDocumentBlocks(window.blockNoteEditor.document)
    }
  }, 1000);

  const headerBlocks = documentBlocks.filter(block => block.type === "heading" && block.content && block.content[0]?.text);

  return (
    <div className="px-3">
      <div className="text-2xl font-bold mb-4">Table of contents</div>
      {headerBlocks.length > 0 && (
        <ul>
          {headerBlocks.map(block => (
            <li key={block.id} style={{marginLeft: `${(block.props.level - 1)}rem`}} className="p-1 cursor-pointer hover:underline"
                onClick={() => {
                  document.querySelector(`[data-id="${block.id}"]`)?.scrollIntoView({behavior: "smooth"});
                }}
            >
              {block.content[0].text}
            </li>
          ))}
        </ul>
      ) || (
        <div className="text-sm text-slate-500">No headers in document yet</div>
      )}
    </div>
  );
}

export default TableOfContentsPanel;
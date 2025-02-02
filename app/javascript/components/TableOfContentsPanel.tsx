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

  const headerBlocks = documentBlocks.filter(block => block.type === "heading").map(block => {
    return {
      ...block,
      label: block.content.reduce((acc, curr) => {
        let toAdd = "";
        if (curr.text) {
          toAdd += curr.text;
        } else if (curr.content) {
          toAdd += curr.content.map(content => content.text);
        }
        return (acc + toAdd);
      }, ""),
    }
  }).filter(block => block.label !== "");

  const markerStyle = (level) => {
    switch (level) {
      case 1: return "list-disc";
      case 2: return "list-[circle]";
      case 3: default: return "list-[square]";
    }
  };

  return (
    <div className="px-3">
      {headerBlocks.length > 0 && (
        <ul className="list-inside">
          {headerBlocks.map(block => (
            <li key={block.id} style={{marginLeft: `${(block.props.level - 1) + 0.25}rem`}} className={`p-1 cursor-pointer hover:underline ${markerStyle(block.props.level)}`}
                onClick={() => {
                  document.querySelector(`[data-id="${block.id}"]`)?.scrollIntoView({behavior: "smooth"});
                }}
            >
              {block.label}
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
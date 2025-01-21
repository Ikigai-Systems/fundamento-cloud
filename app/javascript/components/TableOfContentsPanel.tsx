import {QueryClientProvider} from "@tanstack/react-query";
import queryClient from ".././contextes/ReactQueryClient.tsx";
import '@blocknote/mantine/style.css';
import "./editor/editor-styles.css";

type TableOfContentsPanelProps = {
  content: unknown,
}

const TableOfContentsPanel = ({content}: TableOfContentsPanelProps) => {
  const headerBlocks = content.filter(block => block.type === "heading" && block.content && block.content[0]?.text);

  return (
    <div className="px-3">
      <div className="text-2xl font-bold mb-4">Table of contents</div>
      {headerBlocks.length > 0 && (
        <ul>
          {headerBlocks.map(block => (
            <li key={block.id} style={{marginLeft: `${(block.props.level - 1)}rem`}} className="p-1">
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
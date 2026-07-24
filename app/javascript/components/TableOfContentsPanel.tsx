import '@blocknote/mantine/style.css';
import {useEffect} from "react";

type InlineContent = {
  text?: string,
  content?: InlineContent[],
};

type HeadingBlock = {
  id: string,
  type: "heading",
  props: {level: number},
  content: InlineContent[],
};

type TableOfContentsPanelProps = {
  content: unknown[],
}

const isHeadingBlock = (block: unknown): block is HeadingBlock => {
  if (typeof block !== "object" || block === null) {
    return false;
  }
  const candidate = block as {type?: unknown, content?: unknown};
  return candidate.type === "heading" && Array.isArray(candidate.content);
};

const TableOfContentsPanel = ({content}: TableOfContentsPanelProps) => {
  useEffect(() => {
    setTimeout(() => {
      const anchorBlockId = location.hash.split("#")[1];
      document.querySelector(`[data-id="${anchorBlockId}"]`)?.scrollIntoView({behavior: "smooth"});
    }, 300); // this should await for BlockNote document to be loaded, for a while we simulate that with 300ms delay
  }, [])

  const headerBlocks = content.filter(isHeadingBlock).map(block => {
    return {
      ...block,
      label: block.content.reduce((acc: string, curr) => {
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

  const markerStyle = (level: number) => {
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
              <a href={`#${block.id}`}>
                {block.label}
              </a>
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
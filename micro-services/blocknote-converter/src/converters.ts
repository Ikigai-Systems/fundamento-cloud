import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";
import {toHtml} from "hast-util-to-html";
import rehypeParse from "rehype-parse";
import rehypeRaw from "rehype-raw";
import rehypeRemark from "rehype-remark";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype, {defaultHandlers as remarkRehypeDefaultHandlers} from "remark-rehype";
import remarkStringify from "remark-stringify";
import {unified} from "unified";
import {visit} from "unist-util-visit";
import strippedSchema from "./strippedSchema";
import {setupDOM} from "./setupDOM";

// Initialize DOM environment for React server-side rendering
setupDOM();

export function convertToBlocks(yjs : Buffer) {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(yjs));

  const serverBlockNoteEditor = createServerBlockNoteEditor();

  if (doc.getXmlFragment("document-store").length !== 0) {
    return serverBlockNoteEditor.yDocToBlocks(doc, "document-store");
  } else {
    return [];
  }
}

function createServerBlockNoteEditor() {
  return ServerBlockNoteEditor.create({
    schema: strippedSchema,
  });
}

export function convertToYjs(blocks: any) {
  const serverBlockNoteEditor = createServerBlockNoteEditor();

  return Y.encodeStateAsUpdate(serverBlockNoteEditor.blocksToYDoc(blocks, "document-store"));
}

// ---------------------------------------------------------------------------
// Markdown ↔ HTML pipeline helpers
// ---------------------------------------------------------------------------

/**
 * Rehype plugin: convert <video> elements to markdown image syntax before
 * the HAST→MDAST conversion (which would otherwise drop them).
 * Replicated from @blocknote/core internals.
 */
function convertVideoToMarkdown() {
  return (tree: any) => {
    visit(tree, "element", (node: any, index: number | undefined, parent: any) => {
      if (parent && node.tagName === "video") {
        const src = node.properties?.src || node.properties?.dataUrl || "";
        const name = node.properties?.title || node.properties?.dataName || "";
        parent.children[index!] = {
          type: "text",
          value: `![${name}](${src})`,
        };
      }
    });
  };
}

/**
 * Rehype plugin: remove <u> (underline) tags since Markdown doesn't support
 * underlines. Lifts child nodes outside the underline wrapper.
 * Replicated from @blocknote/core internals.
 */
function removeUnderlines() {
  const helper = (tree: any) => {
    if (!tree.children?.length) return;

    let numChildren = tree.children.length;
    for (let i = 0; i < numChildren; i++) {
      const node = tree.children[i];
      if (node.type === "element") {
        helper(node);
        if (node.tagName === "u") {
          if (node.children.length > 0) {
            tree.children.splice(i, 1, ...node.children);
            const added = node.children.length - 1;
            numChildren += added;
            i += added;
          } else {
            tree.children.splice(i, 1);
            numChildren--;
            i--;
          }
        }
      }
    }
  };
  return helper;
}

/**
 * Rehype plugin: add a space after each checkbox <input> element so that
 * remark-stringify produces correct `- [x] text` markdown syntax.
 * Replicated from @blocknote/core internals.
 */
function addSpacesToCheckboxes() {
  const helper = (tree: any) => {
    if (!tree.children?.length) return;

    for (let i = tree.children.length - 1; i >= 0; i--) {
      const child = tree.children[i];
      const nextChild = i + 1 < tree.children.length ? tree.children[i + 1] : undefined;

      if (
        child.type === "element" &&
        child.tagName === "input" &&
        child.properties?.type === "checkbox" &&
        nextChild?.type === "element" &&
        nextChild.tagName === "p"
      ) {
        nextChild.tagName = "span";
        nextChild.children.splice(0, 0, {type: "text", value: " "});
      } else {
        helper(child);
      }
    }
  };
  return helper;
}

/**
 * Rehype plugin: convert <span data-mention="..."> elements to the HTML
 * format that BlockNote's tryParseHTMLToBlocks recognizes for custom
 * inline content (data-inline-content-type attribute).
 */
function convertMentionSpans() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName === "span" && node.properties?.dataMention) {
        const entity = node.properties.dataMention;
        const entityId = node.properties.dataEntityId || "";
        const title = node.children
          ?.filter((c: any) => c.type === "text")
          .map((c: any) => c.value)
          .join("") || "Untitled";
        const id = crypto.randomUUID();

        // Transform to BlockNote's custom inline content HTML format
        node.properties = {
          "dataInlineContentType": "mention",
          "dataId": id,
          "dataEntity": entity,
          "dataEntityId": entityId,
          "dataTitle": title,
        };
        node.tagName = "span";
      }
    });
  };
}

/**
 * Check whether a HAST node (or any descendant) carries a custom BlockNote
 * content-type attribute. Used to decide whether an element should be
 * preserved as raw HTML in the markdown output.
 */
function hasCustomContentType(node: any): boolean {
  if (node.properties?.dataContentType) return true;
  if (node.properties?.dataInlineContentType) return true;
  if (!node.children) return false;
  return node.children.some((child: any) => hasCustomContentType(child));
}

/**
 * Create a rehype-remark handler that intercepts elements with custom
 * BlockNote data-content-type / data-inline-content-type and emits them as
 * raw HTML mdast nodes, while falling back to the provided default handler
 * for ordinary elements of the same tag.
 */
function makeCustomBlockHandler(defaultHandler: (state: any, node: any, parent: any) => any) {
  return (state: any, element: any, parent: any) => {
    if (hasCustomContentType(element)) {
      const html = toHtml(element);
      const result = {type: "html", value: html};
      state.patch(element, result);
      return result;
    }
    return defaultHandler(state, element, parent);
  };
}

// ---------------------------------------------------------------------------
// Export: Blocks → HTML → Markdown
// ---------------------------------------------------------------------------

// Default hast-util-to-mdast handlers we need to wrap
function defaultDivHandler(state: any, node: any) { return state.toFlow(state.all(node)); }
function defaultSpanHandler(state: any, node: any) { return state.all(node); }

/**
 * Convert an HTML string (produced by blocksToHTMLLossy) to GitHub-Flavored
 * Markdown, preserving custom BlockNote elements as raw HTML blocks.
 */
function htmlToMarkdown(html: string): string {
  const result = unified()
    .use(rehypeParse, {fragment: true})
    .use(convertVideoToMarkdown)
    .use(removeUnderlines)
    .use(addSpacesToCheckboxes)
    .use(rehypeRemark, {
      handlers: {
        div: makeCustomBlockHandler(defaultDivHandler),
        span: makeCustomBlockHandler(defaultSpanHandler),
      },
    })
    .use(remarkGfm)
    .use(remarkStringify, {
      handlers: {text: (node: any) => node.value},
    })
    .processSync(html);

  return result.value as string;
}

// ---------------------------------------------------------------------------
// Import: Markdown → HTML → Blocks
// ---------------------------------------------------------------------------

const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "mkv", "flv", "avi", "wmv", "m4v"];

function isVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase() || "";
    return VIDEO_EXTENSIONS.includes(ext);
  } catch {
    return false;
  }
}

/**
 * remarkRehype handler for code blocks.
 * Uses `data-language` attribute instead of CSS class (BlockNote convention).
 * Replicated from @blocknote/core internals.
 */
function codeHandler(state: any, node: any) {
  const value = node.value ? node.value : "";
  const properties: any = {};

  if (node.lang) {
    properties["data-language"] = node.lang;
  }

  let result: any = {
    type: "element",
    tagName: "code",
    properties,
    children: [{type: "text", value}],
  };

  if (node.meta) {
    result.data = {meta: node.meta};
  }

  state.patch(node, result);
  result = state.applyData(node, result);

  result = {
    type: "element",
    tagName: "pre",
    properties: {},
    children: [result],
  };
  state.patch(node, result);
  return result;
}

/**
 * remarkRehype handler for video nodes (image nodes with video URLs).
 * Replicated from @blocknote/core internals.
 */
function videoHandler(state: any, node: any) {
  const url = String(node?.url || "");
  const title = node?.title ? String(node.title) : undefined;

  let result: any = {
    type: "element",
    tagName: "video",
    properties: {
      src: url,
      "data-name": title,
      "data-url": url,
      controls: true,
    },
    children: [],
  };
  state.patch?.(node, result);
  result = state.applyData ? state.applyData(node, result) : result;
  return result;
}

/**
 * Convert a markdown string to HTML, preserving raw HTML blocks (which may
 * contain custom BlockNote elements) by passing `allowDangerousHtml` through
 * the pipeline.
 *
 * Replicates BlockNote's custom remarkRehype handlers for code, image/video,
 * and blockquote to maintain full compatibility.
 */
function markdownToHtml(markdown: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {
      handlers: {
        ...(remarkRehypeDefaultHandlers as any),
        image: (state: any, node: any) => {
          const url = String(node?.url || "");
          if (isVideoUrl(url)) {
            return videoHandler(state, node);
          } else {
            return remarkRehypeDefaultHandlers.image(state, node);
          }
        },
        code: codeHandler,
        blockquote: (state: any, node: any) => {
          const result = {
            type: "element",
            tagName: "blockquote",
            properties: {},
            children: state.wrap(state.all(node), false),
          };
          state.patch(node, result);
          return state.applyData(node, result);
        },
      },
      allowDangerousHtml: true,
    })
    .use(rehypeRaw)
    .use(convertMentionSpans)
    .use(rehypeStringify, {allowDangerousHtml: true})
    .processSync(markdown);

  return result.value as string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function convertBlocksToMarkdown(blocks: any) {
  const editor = createServerBlockNoteEditor();
  const html = await editor.blocksToHTMLLossy(blocks);
  return htmlToMarkdown(html);
}

export async function convertMarkdownToBlocks(markdown: string) {
  const editor = createServerBlockNoteEditor();
  const html = markdownToHtml(markdown);
  return await editor.tryParseHTMLToBlocks(html);
}

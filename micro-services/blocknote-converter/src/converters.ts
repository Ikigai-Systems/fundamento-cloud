import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";
import type {Block} from "@blocknote/core";
import {toHtml} from "hast-util-to-html";
import type {Element as HastElement, ElementContent, Nodes as HastNodes, Parents as HastParents} from "hast";
import type {Handle as H2mHandle, Options as H2mOptions} from "hast-util-to-mdast";
import type {Options as M2hOptions, State as M2hState} from "mdast-util-to-hast";
import type {Blockquote, Code, Image} from "mdast";
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

export function convertToYjs(blocks: Block[]) {
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
  return (tree: HastNodes) => {
    visit(tree, "element", (node: HastElement, index: number | undefined, parent: HastParents | undefined) => {
      if (parent && (node.tagName === "video" || node.tagName === "audio")) {
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
  const helper = (tree: HastParents) => {
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
  const helper = (tree: HastParents) => {
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
      } else if (child.type === "element") {
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
  return (tree: HastNodes) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName === "span" && node.properties?.dataMention) {
        const entity = String(node.properties.dataMention);
        const entityId = node.properties.dataEntityId ? String(node.properties.dataEntityId) : "";
        const fragment = node.properties.dataFragment ? String(node.properties.dataFragment) : "";
        const title = node.children
          ?.filter((c): c is Extract<ElementContent, {type: "text"}> => c.type === "text")
          .map((c) => c.value)
          .join("") || "Untitled";
        const id = crypto.randomUUID();

        // Transform to BlockNote's custom inline content HTML format
        const props: Record<string, string> = {
          "dataInlineContentType": "mention",
          "dataId": id,
          "dataEntity": entity,
          "dataEntityId": entityId,
          "dataTitle": title,
        };
        if (fragment) {
          props["dataFragment"] = fragment;
        }
        node.properties = props;
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
function hasCustomContentType(node: HastNodes): boolean {
  if ("properties" in node && node.properties?.dataContentType) return true;
  if ("properties" in node && node.properties?.dataInlineContentType) return true;
  if (!("children" in node) || !node.children) return false;
  return node.children.some((child) => hasCustomContentType(child));
}

/**
 * Create a rehype-remark handler that intercepts elements with custom
 * BlockNote data-content-type / data-inline-content-type and emits them as
 * raw HTML mdast nodes, while falling back to the provided default handler
 * for ordinary elements of the same tag.
 */
function makeCustomBlockHandler(defaultHandler: H2mHandle): H2mHandle {
  return (state, element, parent) => {
    if (hasCustomContentType(element)) {
      const html = toHtml(element);
      const result = {type: "html" as const, value: html};
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
const defaultDivHandler: H2mHandle = (state, node) => state.toFlow(state.all(node));
const defaultSpanHandler: H2mHandle = (state, node) => state.all(node);

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
      } satisfies H2mOptions["handlers"],
    })
    .use(remarkGfm)
    .use(remarkStringify, {
      handlers: {text: (node: {value: string}) => node.value},
    })
    .processSync(html);

  return result.value as string;
}

// ---------------------------------------------------------------------------
// Import: Markdown → HTML → Blocks
// ---------------------------------------------------------------------------

const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "mkv", "flv", "avi", "wmv", "m4v"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "aac", "m4a"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "tiff"];

function extractExtension(url: string): string {
  const filename = url.split("/").pop() || "";
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex + 1).toLowerCase();
}

function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.includes(extractExtension(url));
}

function isAudioUrl(url: string): boolean {
  return AUDIO_EXTENSIONS.includes(extractExtension(url));
}

function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.includes(extractExtension(url));
}

/**
 * remarkRehype handler for code blocks.
 * Uses `data-language` attribute instead of CSS class (BlockNote convention).
 * Replicated from @blocknote/core internals.
 */
function codeHandler(state: M2hState, node: Code) {
  const value = node.value ? node.value : "";
  const properties: HastElement["properties"] = {};

  if (node.lang) {
    properties["data-language"] = node.lang;
  }

  let result: HastElement = {
    type: "element",
    tagName: "code",
    properties,
    children: [{type: "text", value}],
  };

  if (node.meta) {
    // `position` is a (structurally) required field on the augmented hast
    // `ElementData` (contributed by hast-util-from-parse5); its sub-fields are
    // all optional, so an empty object satisfies the type without affecting
    // runtime behavior.
    result.data = {meta: node.meta, position: {}};
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
function videoHandler(state: M2hState, node: Image) {
  const url = String(node?.url || "");
  const title = node?.title ? String(node.title) : undefined;

  let result: HastElement = {
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
 * remarkRehype handler for audio nodes (image nodes with audio URLs).
 */
function audioHandler(state: M2hState, node: Image) {
  const url = String(node?.url || "");
  const title = node?.title ? String(node.title) : undefined;

  let result: HastElement = {
    type: "element",
    tagName: "audio",
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
 * remarkRehype handler for generic file nodes (image nodes with non-image, non-video, non-audio URLs).
 * Emits <div data-content-type="file"> which BlockNote parses as a file block.
 */
function fileHandler(state: M2hState, node: Image) {
  const url = String(node?.url || "");
  const name = node?.title || node?.alt || (url.split("/").pop() || url);

  let result: HastElement = {
    type: "element",
    tagName: "div",
    properties: {
      "data-content-type": "file",
      "data-name": name,
      "data-url": url,
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
      // hast-util-to-mdast (used under remark-rehype) already merges these
      // handlers on top of its defaults, so only the overrides are listed.
      handlers: {
        image: (state: M2hState, node: Image) => {
          const url = String(node?.url || "");
          if (isVideoUrl(url)) return videoHandler(state, node);
          if (isAudioUrl(url)) return audioHandler(state, node);
          if (isImageUrl(url)) return remarkRehypeDefaultHandlers.image(state, node);
          return fileHandler(state, node);
        },
        code: codeHandler,
        blockquote: (state: M2hState, node: Blockquote) => {
          const result: HastElement = {
            type: "element",
            tagName: "blockquote",
            properties: {},
            children: state.wrap(state.all(node), false),
          };
          state.patch(node, result);
          return state.applyData(node, result);
        },
      } satisfies M2hOptions["handlers"],
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

export async function convertBlocksToMarkdown(blocks: Block[]) {
  const editor = createServerBlockNoteEditor();
  const html = await editor.blocksToHTMLLossy(blocks);
  return htmlToMarkdown(html);
}

export async function convertMarkdownToBlocks(markdown: string) {
  const editor = createServerBlockNoteEditor();
  const html = markdownToHtml(markdown);
  return await editor.tryParseHTMLToBlocks(html);
}

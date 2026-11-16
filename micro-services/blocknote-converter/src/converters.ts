import * as Y from "yjs";
import {ServerBlockNoteEditor} from "@blocknote/server-util";
import type {Block} from "@blocknote/core";
import {updateYFragment} from "y-prosemirror";
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

/**
 * BlockNote drops any link whose href uses a scheme outside its allowlist
 * (http|https|ftp|ftps|mailto|tel|callto|sms|cid|xmpp) -- the href is stripped and the
 * anchor collapses to plain text, silently. Attachments are addressed internally as
 * `attachment:<id>`, resolved to a real endpoint at render time, so links to them have to
 * survive the round-trip.
 *
 * The default predicate is copied rather than imported: @blocknote/core 0.54.0 does not
 * export `isAllowedUri` at runtime, despite its own JSDoc telling you to import it. Keep
 * this in step with ALLOWED_URI_REGEX in
 * @blocknote/core/src/extensions/tiptap-extensions/Link/link.ts.
 */
const BLOCKNOTE_ALLOWED_URI =
  // eslint-disable-next-line no-useless-escape
  /^(?:(?:http|https|ftp|ftps|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))/i;

export function isValidLink(href: string): boolean {
  return BLOCKNOTE_ALLOWED_URI.test(href) || href.startsWith("attachment:");
}

function createServerBlockNoteEditor() {
  return ServerBlockNoteEditor.create({
    schema: strippedSchema,
    links: {isValidLink},
  });
}

/**
 * Clamps table cell spans to the table they are in.
 *
 * A colspan or rowspan reaching past the last column or row makes @blocknote/core's
 * blocksToYDoc index a row that is not there, and it throws "Cannot read properties of
 * undefined (reading '0')" — which takes the whole document with it, not just the table.
 *
 * Real data had one: a table whose final row holds a single cell with a rowspan claiming rows
 * past the end of the table. It made that document impossible to convert in either direction,
 * and it is why the attachment id migration could not finish.
 *
 * Whatever wrote it, a span cannot mean anything outside the table, so this clamps rather than
 * rejects: refusing to convert the document would be the worse answer. Valid tables are
 * untouched, because a span within bounds clamps to itself.
 */
function clampTableSpans(blocks: unknown[]): void {
  for (const block of blocks) {
    if (!block || typeof block !== "object") {
      continue;
    }

    const node = block as {content?: unknown; children?: unknown};
    const content = node.content as
      | {type?: string; columnWidths?: unknown[]; rows?: {cells?: unknown[]}[]}
      | undefined;

    if (content?.type === "tableContent" && Array.isArray(content.rows)) {
      const rows = content.rows;
      const columns = Array.isArray(content.columnWidths)
        ? content.columnWidths.length
        : Math.max(...rows.map((row) => (Array.isArray(row?.cells) ? row.cells.length : 0)), 0);

      rows.forEach((row, rowIndex) => {
        if (!Array.isArray(row?.cells)) {
          return;
        }

        let column = 0;

        for (const cell of row.cells) {
          // Content saved before BlockNote 0.25 stores a cell as its inline content array,
          // which carries no spans to clamp.
          const props = (cell as {props?: {colspan?: number; rowspan?: number}})?.props;

          if (!props) {
            column += 1;
            continue;
          }

          const colspan = props.colspan ?? 1;
          const rowspan = props.rowspan ?? 1;

          props.colspan = Math.max(1, Math.min(colspan, columns - column));
          props.rowspan = Math.max(1, Math.min(rowspan, rows.length - rowIndex));

          column += props.colspan;
        }
      });
    }

    if (Array.isArray(node.children)) {
      clampTableSpans(node.children);
    }
  }
}

export function convertToYjs(blocks: Block[]) {
  const serverBlockNoteEditor = createServerBlockNoteEditor();

  clampTableSpans(blocks);

  return Y.encodeStateAsUpdate(serverBlockNoteEditor.blocksToYDoc(blocks, "document-store"));
}

/**
 * Brings a document's current Yjs state to the given blocks and returns only what changed,
 * together with the whole new state.
 *
 * Replacing the state (convertToYjs) throws away the history a connected editor is built on, so
 * anyone editing the document keeps a state that no longer matches the stored one, and the next
 * thing they type overwrites the change. An update merges: it is applied to the state an editor
 * already holds, next to whatever that editor did meanwhile.
 *
 * The diff is by structure, so a block that is unchanged (same id, same content) costs nothing
 * and a block whose id was lost is a delete and an insert. That is why ids must survive the trip
 * through markdown.
 */
export function convertToYjsUpdate(currentSync: Buffer, blocks: Block[]) {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(currentSync));
  const before = Y.encodeStateVector(doc);

  clampTableSpans(blocks);

  const node = createServerBlockNoteEditor()._blocksToProsemirrorNode(blocks);
  updateYFragment(doc, doc.getXmlFragment("document-store"), node, {
    mapping: new Map(),
    isOMark: new Map(),
  } as unknown as Parameters<typeof updateYFragment>[3]);

  return {update: Y.encodeStateAsUpdate(doc, before), state: Y.encodeStateAsUpdate(doc)};
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
 * Rehype plugin: convert BlockNote file blocks to markdown embed syntax.
 *
 * blocksToHTMLLossy serialises a file block as an anchor carrying data-url:
 *   <a href="attachment:9" data-name="report.csv" data-url="attachment:9">report.csv</a>
 *
 * Left alone, hast-util-to-mdast renders that as `[report.csv](attachment:9)`, and the
 * markdown->HTML direction cannot turn a link back into a file block — custom URL schemes
 * are dropped when BlockNote parses the anchor, so reading a document and writing it back
 * silently loses every attachment. Emitting the embed form instead matches what image,
 * video and audio blocks already produce, and markdownToHtml's image handler routes it to
 * fileHandler, closing the round-trip.
 *
 * Only anchors carrying data-url are touched, so ordinary inline links are untouched.
 */
function convertFileToMarkdown() {
  return (tree: HastNodes) => {
    visit(tree, "element", (node: HastElement, index: number | undefined, parent: HastParents | undefined) => {
      if (parent && node.tagName === "a" && node.properties?.dataUrl) {
        const url = node.properties.dataUrl;
        const name = node.properties.dataName || "";
        parent.children[index!] = {
          type: "text",
          value: `![${name}](${url})`,
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
    .use(convertFileToMarkdown)
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
// Block ids in markdown (Obsidian `^id` syntax)
// ---------------------------------------------------------------------------

// blocksToHTMLLossy drops block ids, and markdown has no place for them, so a document written
// out and read back gets fresh random ids -- and anything that points at a block (comments,
// links) loses it. Obsidian's answer is a ` ^id` at the end of a line, or a `^id` line of its
// own after a block with no text to hang it on. We use the same syntax, so a file edited in
// Obsidian and one read through the API look alike.
const BLOCK_ID = /^[A-Za-z0-9-]{2,}$/;
const TRAILING_MARKER = /^(.*?) \^([A-Za-z0-9-]{2,})$/s;
const STANDALONE_MARKER = /^\^([A-Za-z0-9-]{2,})$/;

type LooseBlock = {
  id?: string;
  type?: string;
  content?: unknown;
  children?: LooseBlock[];
  props?: Record<string, unknown>;
};

type InlineText = {type: string; text?: string};

// Code is inline content too, but its text is the code: a marker appended there would be part of
// the program, so code gets a marker line of its own like the blocks with no inline content.
function hasMarkableText(block: LooseBlock): boolean {
  return Array.isArray(block.content) && block.type !== "codeBlock";
}

// A media block's caption leaves the HTML as a paragraph of its own, so a marker line after the
// block would land on the caption and take its id. Such a block goes unmarked until captions
// round-trip as captions.
function hasCaption(block: LooseBlock): boolean {
  return typeof block.props?.caption === "string" && block.props.caption !== "";
}

function markerParagraph(id: string): LooseBlock {
  return {
    id: `marker-${id}`,
    type: "paragraph",
    props: {},
    content: [{type: "text", text: `^${id}`, styles: {}}],
    children: [],
  };
}

/**
 * Returns a copy of the blocks with the marker of each selected block written into it: a
 * trailing text node when the block has inline content, otherwise a paragraph right after it.
 */
function addBlockIdMarkers(blocks: Block[], selection: MarkdownExportOptions["blockIds"]): Block[] {
  if (!selection) {
    return blocks;
  }

  const selected = selection === "all" ? undefined : new Set(selection);
  const wants = (id: string | undefined): id is string =>
    typeof id === "string" && BLOCK_ID.test(id) && (selected === undefined || selected.has(id));

  const mark = (list: LooseBlock[]): LooseBlock[] =>
    list.flatMap((block) => {
      const children = mark(block.children ?? []);

      if (!wants(block.id) || hasCaption(block)) {
        return [{...block, children}];
      }

      if (hasMarkableText(block)) {
        const content = [...(block.content as unknown[]), {type: "text", text: ` ^${block.id}`, styles: {}}];
        return [{...block, content, children}];
      }

      return [{...block, children}, markerParagraph(block.id)];
    });

  return mark(blocks as unknown as LooseBlock[]) as unknown as Block[];
}

function lastText(block: LooseBlock): InlineText | undefined {
  if (!Array.isArray(block.content)) {
    return undefined;
  }

  const last = block.content[block.content.length - 1] as InlineText | undefined;
  return last?.type === "text" ? last : undefined;
}

/**
 * Reads the markers written by addBlockIdMarkers (or by hand) back into block ids and removes
 * them from the text. Works in place on the blocks the parser just made.
 *
 * Two blocks claiming one id is possible (a hand-written file, a copied block): the first keeps
 * it and the rest keep the random id the parser gave them, so ids stay unique in the result.
 */
function restoreBlockIds(blocks: unknown[], existingIds: MarkdownImportOptions["existingIds"]): void {
  if (existingIds === undefined) {
    return;
  }

  const taken = new Set<string>();
  // A marker is read (and stripped) when its id is known; it is applied only the first time.
  const known = (id: string) => existingIds === "any" || existingIds.has(id);
  const claim = (id: string) => {
    if (taken.has(id)) {
      return false;
    }

    taken.add(id);
    return true;
  };

  const restore = (list: LooseBlock[]): LooseBlock[] => {
    const result: LooseBlock[] = [];

    for (const block of list) {
      block.children = restore(block.children ?? []);

      const only =
        block.type === "paragraph" && Array.isArray(block.content) && block.content.length === 1
          ? STANDALONE_MARKER.exec((block.content[0] as InlineText).text ?? "")
          : null;
      const previous = result[result.length - 1];

      if (only && previous && known(only[1])) {
        if (claim(only[1])) {
          previous.id = only[1];
        }
        continue;
      }

      const text = lastText(block);
      const match = text?.text !== undefined ? TRAILING_MARKER.exec(text.text) : null;

      if (text && match && known(match[2])) {
        text.text = match[1];

        if (claim(match[2])) {
          block.id = match[2];
        }

        if (text.text === "") {
          (block.content as unknown[]).pop();
        }
      }

      result.push(block);
    }

    return result;
  };

  const restored = restore(blocks as LooseBlock[]);
  blocks.splice(0, blocks.length, ...restored);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MarkdownExportOptions {
  /**
   * Which blocks carry an Obsidian-style ` ^id` marker, so their ids survive a trip through
   * markdown. "all" marks every block, a list marks only those ids. Omitted: no markers.
   */
  blockIds?: "all" | Iterable<string>;
}

export interface MarkdownImportOptions {
  /**
   * Read ` ^id` markers as block ids. "any" honours every marker, as Obsidian does, for a new
   * document. A set honours only markers naming an id in it, for an update, where the set is
   * the ids of the document being updated: any other `^word` stays literal text. Omitted:
   * markers are ordinary text, which is what every caller before this option got.
   */
  existingIds?: ReadonlySet<string> | "any";
}

export async function convertBlocksToMarkdown(blocks: Block[], options: MarkdownExportOptions = {}) {
  const editor = createServerBlockNoteEditor();
  const html = await editor.blocksToHTMLLossy(addBlockIdMarkers(blocks, options.blockIds));
  return htmlToMarkdown(html);
}

export async function convertMarkdownToBlocks(markdown: string, options: MarkdownImportOptions = {}) {
  const editor = createServerBlockNoteEditor();
  const html = markdownToHtml(markdown);
  const blocks = await editor.tryParseHTMLToBlocks(html);
  restoreBlockIds(blocks, options.existingIds);
  return blocks;
}

/**
 * Both halves of creating a document from markdown, in one process. Every CLI call pays
 * Node's startup and the bundle load (~240 MB, most of the CPU for a small document), so
 * doing this as two calls doubled the cost of each imported document.
 *
 * The blocks go through JSON before the Yjs conversion so the document matches what the two-call
 * path produced, where they crossed into Ruby and back as JSON.
 */
export async function convertMarkdownToBlocksAndYjs(markdown: string, options: MarkdownImportOptions = {}) {
  const blocks = await convertMarkdownToBlocks(markdown, options);
  const yjs = convertToYjs(JSON.parse(JSON.stringify(blocks)));
  return {blocks, yjs};
}

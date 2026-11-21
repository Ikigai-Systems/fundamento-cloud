import {createExtension, ExtensionOptions} from "@blocknote/core";
import {Node as ProseNode} from "prosemirror-model";
import {EditorState, Plugin, PluginKey} from "prosemirror-state";
import {Decoration, DecorationSet, EditorView} from "prosemirror-view";

// The text a comment is about, with the text around it to tell it from the same words elsewhere in the block.
export type CommentQuote = {blockId: string, quote: string, prefix: string, suffix: string}

export type BlockCommentsOptions = {
  objectGid: string,
  blockIds: string[],
  quotes: CommentQuote[],
  canComment: boolean,
}

type AddBlock = {add: string, quote?: CommentQuote}
type BlockCommentsState = {blockIds: Set<string>, quotes: CommentQuote[]}

const CONTEXT_LENGTH = 32;

const pluginKey = new PluginKey<BlockCommentsState>("blockComments");
const blockCommentsFrameId = (blockId: string) => `object_comments_block_${blockId}`;
const newCommentFrameId = (blockId: string) => `new_object_comment_block_${blockId}`;

const commentsFrame = ({objectGid, canComment}: BlockCommentsOptions, blockId: string) => {
  const wrapper = document.createElement("div");
  wrapper.className = "block-comments";
  wrapper.contentEditable = "false";
  const params = new URLSearchParams({object_gid: objectGid, block_id: blockId});
  if (!canComment) params.set("read_only", "1");
  const frame = document.createElement("turbo-frame");
  frame.id = blockCommentsFrameId(blockId);
  frame.setAttribute("src", `/comments?${params}`);
  wrapper.appendChild(frame);
  return wrapper;
}

// A block's text, for saying what a comment was about once the block is gone.
const blockText = (state: EditorState, blockId: string): string => {
  let text = "";
  state.doc.descendants((node) => {
    if (node.type.name === "blockContainer" && node.attrs.id === blockId) {
      text = node.firstChild?.textContent ?? "";
      return false;
    }
    return true;
  });
  return text;
}

// Where a quote is in its block: the first place the quote is found with its surroundings, else the
// first place it is found at all. Marks are no obstacle, a quote can run across them.
const quoteRange = (block: ProseNode, blockPos: number, {quote, prefix, suffix}: CommentQuote) => {
  const runs: {pos: number, text: string, offset: number}[] = [];
  let text = "";
  block.firstChild!.descendants((node, pos) => {
    if (!node.isText) return true;
    runs.push({pos: blockPos + 2 + pos, text: node.text!, offset: text.length});
    text += node.text!;
    return false;
  });

  let start = text.indexOf(prefix + quote + suffix);
  start = start === -1 ? text.indexOf(quote) : start + prefix.length;
  if (start === -1) return null;

  const at = (offset: number, isEnd: boolean) => {
    const run = runs.find((r) => (isEnd ? offset <= r.offset + r.text.length : offset < r.offset + r.text.length) && offset >= r.offset);
    return run ? run.pos + offset - run.offset : null;
  };
  const from = at(start, false);
  const to = at(start + quote.length, true);
  return from === null || to === null ? null : {from, to};
}

// Opens the form that starts a comment under a block, once the block's own frame is there to hold it.
const openCommentForm = (objectGid: string, blockId: string, text: string, quote?: CommentQuote) => {
  const params = new URLSearchParams({object_gid: objectGid, anchor_block_id: blockId, anchor_text: text});
  if (quote) {
    params.set("anchor_quote", quote.quote);
    params.set("anchor_prefix", quote.prefix);
    params.set("anchor_suffix", quote.suffix);
  }
  const open = () => {
    const form = document.getElementById(newCommentFrameId(blockId)) as (HTMLElement & {src: string}) | null;
    if (!form) return false;
    form.src = `/comments/new?${params}`;
    return true;
  };

  if (open()) return;

  // The block had no comments, so its frame has only just been added and is still loading.
  document.getElementById(blockCommentsFrameId(blockId))?.addEventListener("turbo:frame-load", open, {once: true});
}

// Starts a comment under a block, adding the block's comments to the page first when it has none yet.
const startComment = (view: EditorView, objectGid: string, blockId: string, quote?: CommentQuote) => {
  if (!pluginKey.getState(view.state)?.blockIds.has(blockId)) {
    const add: AddBlock = {add: blockId};
    view.dispatch(view.state.tr.setMeta(pluginKey, add));
  }
  openCommentForm(objectGid, blockId, blockText(view.state, blockId), quote);
}

// The button that starts a comment on the block under the pointer. It sits in the right margin of
// the document, so it works the same in edit and show mode and stays clear of the side menu.
const commentButton = (view: EditorView, {objectGid}: BlockCommentsOptions) => {
  const container = view.dom.parentElement!;
  if (getComputedStyle(container).position === "static") container.style.position = "relative";

  const button = document.createElement("button");
  button.type = "button";
  button.contentEditable = "false";
  button.title = "Comment on this block";
  button.setAttribute("aria-label", "Comment on this block");
  button.setAttribute("data-block-comment-button", "");
  button.className = "absolute right-2 z-10 hidden items-center justify-center size-7 rounded-lg text-gray-500 hover:bg-blue-100 hover:text-blue-700";
  button.innerHTML = `<i class="icon-[tabler--message]"></i>`;
  container.appendChild(button);

  let blockId: string | undefined;

  const show = (event: MouseEvent) => {
    const block = (event.target as HTMLElement).closest<HTMLElement>('[data-node-type="blockContainer"][data-id]');
    const content = block?.querySelector<HTMLElement>(":scope > .bn-block-content");
    if (!block || !content) return;

    blockId = block.dataset.id;
    button.style.top = `${content.getBoundingClientRect().top - container.getBoundingClientRect().top}px`;
    button.classList.replace("hidden", "flex");
  };
  const hide = () => button.classList.replace("flex", "hidden");

  const start = () => {
    if (blockId) startComment(view, objectGid, blockId);
  };

  view.dom.addEventListener("mousemove", show);
  container.addEventListener("mouseleave", hide);
  button.addEventListener("click", start);

  return {
    destroy() {
      view.dom.removeEventListener("mousemove", show);
      container.removeEventListener("mouseleave", hide);
      button.remove();
    },
  };
}

// The selected text of one block, as a quote, or nothing when the selection is empty, spans blocks or is
// inside a comment. It reads the browser's selection, which also exists when the document is read only.
const selectedQuote = (view: EditorView) => {
  const selection = window.getSelection();
  const {anchorNode, focusNode} = selection ?? {};
  if (!selection || selection.isCollapsed || !anchorNode || !focusNode) return null;

  const inDocument = (node: Node) => view.dom.contains(node) && !(node.parentElement ?? (node as HTMLElement)).closest(".block-comments");
  if (!inDocument(anchorNode) || !inDocument(focusNode)) return null;

  const [a, b] = [view.posAtDOM(anchorNode, selection.anchorOffset), view.posAtDOM(focusNode, selection.focusOffset)];
  const [from, to] = [Math.min(a, b), Math.max(a, b)];
  const [$from, $to] = [view.state.doc.resolve(from), view.state.doc.resolve(to)];
  if (!$from.sameParent($to) || !$from.parent.inlineContent) return null;

  const quote = view.state.doc.textBetween(from, to);
  if (!quote.trim()) return null;

  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name !== "blockContainer") continue;
    return {
      from,
      to,
      quote: {
        blockId: node.attrs.id as string,
        quote,
        prefix: view.state.doc.textBetween($from.start(), from).slice(-CONTEXT_LENGTH),
        suffix: view.state.doc.textBetween(to, $from.end()).slice(0, CONTEXT_LENGTH),
      },
    };
  }
  return null;
}

// The button that starts a comment on the selected text. It sits in the right margin, level with the
// start of the selection and beside the block's own comment button: next to the text it would be
// covered by the formatting toolbar, which a document that is only read does not have.
const quoteButton = (view: EditorView, {objectGid}: BlockCommentsOptions) => {
  const container = view.dom.parentElement!;

  const button = document.createElement("button");
  button.type = "button";
  button.contentEditable = "false";
  button.setAttribute("data-quote-comment-button", "");
  button.title = "Comment on the selected text";
  button.setAttribute("aria-label", "Comment on the selected text");
  button.className = "absolute right-11 z-10 hidden items-center justify-center size-7 rounded-lg bg-gray-800 text-white hover:bg-blue-600";
  button.innerHTML = `<i class="icon-[tabler--message-plus]"></i>`;
  container.appendChild(button);

  let selected: ReturnType<typeof selectedQuote> = null;

  const update = () => {
    selected = selectedQuote(view);
    if (!selected) {
      button.classList.replace("flex", "hidden");
      return;
    }
    button.style.top = `${view.coordsAtPos(selected.from).top - container.getBoundingClientRect().top}px`;
    button.classList.replace("hidden", "flex");
  };

  // The click must not take the selection away from the text before it has been read.
  const keepSelection = (event: MouseEvent) => event.preventDefault();
  const start = () => {
    if (selected) startComment(view, objectGid, selected.quote.blockId, selected.quote);
    window.getSelection()?.removeAllRanges();
    button.classList.replace("flex", "hidden");
  };

  // Once a comment with a quote is saved, the quote is marked in its block.
  const marked = (event: Event) => {
    const {success, formSubmission} = (event as CustomEvent).detail;
    const form: HTMLFormElement | undefined = formSubmission?.formElement;
    if (!success || !form?.closest('[id^="new_object_comment_block_"]')) return;

    const field = (name: string) => (form.elements.namedItem(`comment[${name}]`) as HTMLInputElement | null)?.value;
    const blockId = field("anchor_block_id");
    const quote = field("anchor_quote");
    if (!blockId || !quote) return;

    const add: AddBlock = {add: blockId, quote: {blockId, quote, prefix: field("anchor_prefix") ?? "", suffix: field("anchor_suffix") ?? ""}};
    view.dispatch(view.state.tr.setMeta(pluginKey, add));
  };

  document.addEventListener("selectionchange", update);
  document.addEventListener("turbo:submit-end", marked);
  button.addEventListener("mousedown", keepSelection);
  button.addEventListener("click", start);

  return {
    destroy() {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("turbo:submit-end", marked);
      button.remove();
    },
  };
}

// A link to a block (`#<block id>`) lands on it, once the editor has laid the blocks out.
const scrollToLinkedBlock = (view: EditorView) => {
  const blockId = decodeURIComponent(window.location.hash.slice(1));
  if (!blockId) return;

  requestAnimationFrame(() => {
    view.dom.querySelector(`[data-node-type="blockContainer"][data-id="${CSS.escape(blockId)}"]`)
      ?.scrollIntoView({block: "center"});
  });
}

export const blockCommentsExtension = createExtension(({options}: ExtensionOptions<BlockCommentsOptions>) => ({
  key: "blockComments",
  prosemirrorPlugins: [
    new Plugin<BlockCommentsState>({
      key: pluginKey,
      state: {
        init: () => ({blockIds: new Set(options.blockIds), quotes: options.quotes ?? []}),
        apply: (transaction, state) => {
          const added: AddBlock | undefined = transaction.getMeta(pluginKey);
          if (!added) return state;
          return {
            blockIds: new Set(state.blockIds).add(added.add),
            quotes: added.quote ? [...state.quotes, added.quote] : state.quotes,
          };
        },
      },
      view: (view) => {
        scrollToLinkedBlock(view);
        if (!options.canComment) return {};

        const [block, quote] = [commentButton(view, options), quoteButton(view, options)];
        return {destroy() { block.destroy(); quote.destroy(); }};
      },
      props: {
        decorations(state) {
          const {blockIds, quotes} = pluginKey.getState(state)!;
          if (!blockIds.size) return null;
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== "blockContainer") return true;
            const id: string = node.attrs.id;
            if (blockIds.has(id)) {
              const position = pos + 1 + node.firstChild!.nodeSize;
              decorations.push(Decoration.widget(position, () => commentsFrame(options, id), {
                key: `block-comments-${id}`, side: 1, ignoreSelection: true, stopEvent: () => true,
              }));
              quotes.filter((q) => q.blockId === id).forEach((q) => {
                const range = quoteRange(node, pos, q);
                if (range) decorations.push(Decoration.inline(range.from, range.to, {class: "bg-yellow-100 dark:bg-yellow-900/40 border-b-2 border-yellow-500"}));
              });
            }
            return true;
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    }),
  ],
}));

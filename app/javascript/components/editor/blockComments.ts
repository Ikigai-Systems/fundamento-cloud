import {createExtension, ExtensionOptions} from "@blocknote/core";
import {EditorState, Plugin, PluginKey} from "prosemirror-state";
import {Decoration, DecorationSet, EditorView} from "prosemirror-view";

export type BlockCommentsOptions = {
  objectGid: string,
  blockIds: string[],
  canComment: boolean,
}

type AddBlock = {add: string}

const pluginKey = new PluginKey<Set<string>>("blockComments");
const blockCommentsFrameId = (blockId: string) => `object_comments_block_${blockId}`;
const newCommentFrameId = (blockId: string) => `new_object_comment_block_${blockId}`;

const commentsFrame = (objectGid: string, blockId: string) => {
  const wrapper = document.createElement("div");
  wrapper.className = "block-comments";
  wrapper.contentEditable = "false";
  const params = new URLSearchParams({object_gid: objectGid, block_id: blockId});
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

// Opens the form that starts a comment under a block, once the block's own frame is there to hold it.
const openCommentForm = (objectGid: string, blockId: string, text: string) => {
  const params = new URLSearchParams({object_gid: objectGid, anchor_block_id: blockId, anchor_text: text});
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
    if (!blockId) return;
    const id = blockId;
    if (!pluginKey.getState(view.state)?.has(id)) {
      const add: AddBlock = {add: id};
      view.dispatch(view.state.tr.setMeta(pluginKey, add));
    }
    openCommentForm(objectGid, id, blockText(view.state, id));
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

export const blockCommentsExtension = createExtension(({options}: ExtensionOptions<BlockCommentsOptions>) => ({
  key: "blockComments",
  prosemirrorPlugins: [
    new Plugin<Set<string>>({
      key: pluginKey,
      state: {
        init: () => new Set(options.blockIds),
        apply: (transaction, blockIds) => {
          const added: AddBlock | undefined = transaction.getMeta(pluginKey);
          return added ? new Set(blockIds).add(added.add) : blockIds;
        },
      },
      view: (view) => options.canComment ? commentButton(view, options) : {},
      props: {
        decorations(state) {
          const blockIds = pluginKey.getState(state);
          if (!blockIds?.size) return null;
          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== "blockContainer") return true;
            const id: string = node.attrs.id;
            if (blockIds.has(id)) {
              const position = pos + 1 + node.firstChild!.nodeSize;
              decorations.push(Decoration.widget(position, () => commentsFrame(options.objectGid, id), {
                key: `block-comments-${id}`, side: 1, ignoreSelection: true, stopEvent: () => true,
              }));
            }
            return true;
          });
          return DecorationSet.create(state.doc, decorations);
        },
      },
    }),
  ],
}));

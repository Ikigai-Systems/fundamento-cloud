import {createExtension, ExtensionOptions} from "@blocknote/core";
import {Plugin, PluginKey} from "prosemirror-state";
import {Decoration, DecorationSet} from "prosemirror-view";

export type BlockCommentsOptions = {
  // GlobalID of the document the comments belong to.
  objectGid: string,
  // Blocks that have comments when the editor is created.
  blockIds: string[],
}

const pluginKey = new PluginKey<Set<string>>("blockComments");

// The frame a block's comments are loaded into. It matches ObjectComment.frame_id_for, which is
// what a new comment on the block reloads.
const blockCommentsFrameId = (blockId: string) => `object_comments_block_${blockId}`;

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

// Shows the comments on a block under the block, in the editor and in the read-only views alike.
// A block's comments are outside the document: they are server-rendered Turbo frames, so
// they need no part of the Yjs content and do not change it.
export const blockCommentsExtension = createExtension(({options}: ExtensionOptions<BlockCommentsOptions>) => ({
  key: "blockComments",
  prosemirrorPlugins: [
    new Plugin<Set<string>>({
      key: pluginKey,
      state: {
        init: () => new Set(options.blockIds),
        apply: (_transaction, blockIds) => blockIds,
      },
      props: {
        decorations(state) {
          const blockIds = pluginKey.getState(state);
          if (!blockIds?.size) return null;

          const decorations: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== "blockContainer") return true;

            const id: string = node.attrs.id;
            if (blockIds.has(id)) {
              // After the block's own content, before the blocks nested in it.
              const position = pos + 1 + node.firstChild!.nodeSize;
              decorations.push(Decoration.widget(position, () => commentsFrame(options.objectGid, id), {
                key: `block-comments-${id}`,
                side: 1,
                ignoreSelection: true,
                stopEvent: () => true,
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

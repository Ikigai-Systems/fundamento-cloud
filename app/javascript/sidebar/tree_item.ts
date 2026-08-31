import DocumentsApi from "../api/DocumentsApi.js"
import {applyObjectIcon} from "./object_icon"
import {RenderContext, TreeNode} from "./types"

// The markup lives in a <template> in app/views/spaces/sidebar.html.erb — see the comment there.
// Everything below either fills a value in or removes a part that does not apply, so a document
// title reaches the DOM as text and can never be parsed as markup.
export function renderTreeItem(
  template: HTMLTemplateElement,
  node: TreeNode,
  ctx: RenderContext,
  level: number,
): HTMLLIElement {
  const li = template.content.firstElementChild!.cloneNode(true) as HTMLLIElement;

  // The payload omits these fields when they are at their default, so read them defensively.
  const selected = ctx.selectedId === node.id;
  const hasChildren = (node.children ?? []).length > 0;
  const archived = node.archived ?? false;
  const draft = node.draft ?? false;

  li.dataset.nodeId = node.id;
  li.dataset.level = String(level);
  if (hasChildren) li.dataset.hasChildren = "true";

  const container = li.querySelector<HTMLElement>(".content-link-container")!;
  if (archived) {
    container.classList.add("archived");
    // The "visibility" controller on the sidebar wrapper toggles these; sidebar_tree_controller
    // applies the current cookie state after each render, since re-rendered nodes are new.
    container.dataset.visibilityTarget = "hideable";
  }
  if (selected) container.classList.add("selected");

  li.querySelector<HTMLAnchorElement>("a.content-link")!.href =
    DocumentsApi.show.path({id: node.id});

  li.querySelector<HTMLElement>(".document-padding-left")!
    .style.setProperty("--level", String(level));

  li.querySelector<HTMLElement>(".collapsible-trigger")!.dataset.nodeId = node.id;

  // The <span class="truncate"> and the icon share a parent, which is the element
  // content_title_sync_controller looks up by data-document-id when a document is renamed.
  const label = li.querySelector<HTMLElement>("span.truncate")!;
  label.textContent = node.title;
  label.parentElement!.dataset.documentId = node.id;

  // The template carries the type's default <i>; swap in the object's own icon when it has one.
  applyObjectIcon(label.parentElement!, node.icon);

  if (!draft) li.querySelector(".draft-lozenge")!.remove();

  const actions = li.querySelector<HTMLElement>(".content-link-buttons-container")!;
  if (ctx.canUpdateSpace) {
    actions.querySelector<HTMLInputElement>('input[name="parent_id"]')!.value = node.id;

    const editLink = actions.querySelector<HTMLAnchorElement>("a.content-link-button")!;
    editLink.href = DocumentsApi.edit.path({id: node.id});

    if (selected) {
      actions.querySelectorAll(".content-link-button")
        .forEach(button => button.classList.add("selected"));
    }
  } else {
    actions.replaceChildren();
  }

  li.querySelectorAll<HTMLElement>(":scope > ul").forEach(list => {
    list.dataset.spaceId = ctx.spaceId;
    list.dataset.documentId = node.id;
  });

  return li;
}

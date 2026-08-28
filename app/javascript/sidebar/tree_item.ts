import {RenderContext, TreeNode} from "./types";

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

// escapeHtml only escapes &, <, > — safe for text content, but not for interpolating into a
// quoted attribute value, where a stray " or ' would break out of the attribute.
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function iconHtml(node: TreeNode): string {
  return node.emoji ? escapeHtml(node.emoji) : `<i class="fa-regular fa-file-lines"></i>`;
}

function actionsHtml(node: TreeNode, ctx: RenderContext, selected: boolean): string {
  if (!ctx.canUpdateSpace) return "";
  const selectedClass = selected ? " selected" : "";

  // Mirrors button_to: a real form POST with data-turbo="false" so the page fully reloads.
  return `
    <form class="flex items-center" method="post" action="/d" data-turbo="false">
      <input type="hidden" name="authenticity_token" value="${escapeAttr(ctx.csrfToken)}">
      <input type="hidden" name="space_id" value="${escapeAttr(ctx.spaceId)}">
      <input type="hidden" name="document[title]" value="">
      <input type="hidden" name="parent_type" value="Document">
      <input type="hidden" name="parent_id" value="${escapeAttr(node.id)}">
      <button type="submit" class="content-link-button${selectedClass}"><i class="fa-regular fa-plus"></i></button>
    </form>
    <a class="content-link-button${selectedClass}" href="/d/${encodeURIComponent(node.id)}/edit" data-turbo-frame="content"><i class="fa-regular fa-pencil"></i></a>
  `;
}

export function renderTreeItem(node: TreeNode, ctx: RenderContext, level: number): HTMLLIElement {
  const selected = ctx.selectedId === node.id;
  const hasChildren = node.children.length > 0;

  const li = document.createElement("li");
  li.className = "section-content-node-container";
  li.dataset.nodeId = node.id;
  li.dataset.level = String(level);
  if (hasChildren) li.dataset.hasChildren = "true";

  const containerClasses = ["content-link-container", "group"];
  if (node.archived) containerClasses.push("archived");
  if (selected) containerClasses.push("selected");

  li.innerHTML = `
    <div class="${containerClasses.join(" ")}"${node.archived ? ` data-visibility-target="hideable"` : ""}>
      <a class="content-link" href="/d/${encodeURIComponent(node.id)}" data-turbo-frame="content">
        <div class="document-padding-left flex items-center w-full" style="--level: ${level}">
          <button type="button" class="collapsible-trigger flex items-center justify-center"
                  data-action="click->sidebar-tree#toggle:prevent" data-node-id="${escapeAttr(node.id)}">
            <div class="collapsible-icon icon-[heroicons--chevron-right-16-solid] size-4"></div>
            <div class="collapsible-dot">•</div>
          </button>
          <div data-document-id="${escapeAttr(node.id)}" class="flex flex-grow min-w-0 gap-1 mx-0 p-2 items-center">
            ${iconHtml(node)}
            <span class="truncate">${escapeHtml(node.title)}</span>
            ${node.draft ? `<span class="draft-lozenge">Draft</span>` : ""}
          </div>
        </div>
      </a>
      <div class="content-link-buttons-container">${actionsHtml(node, ctx, selected)}</div>
    </div>
    <ul data-controller="draggable" data-space-id="${escapeAttr(ctx.spaceId)}" data-document-id="${escapeAttr(node.id)}"></ul>
    <ul data-controller="draggable" data-sidebar-tree-children="true" data-space-id="${escapeAttr(ctx.spaceId)}" data-document-id="${escapeAttr(node.id)}"></ul>
  `;

  return li;
}

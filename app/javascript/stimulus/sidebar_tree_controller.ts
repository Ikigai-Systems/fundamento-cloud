import {Controller} from "@hotwired/stimulus"
import {loadExpanded, saveExpanded} from "../sidebar/expansion_store"
import {renderTreeItem} from "../sidebar/tree_item"
import {ObjectIcon, RenderContext, TreeNode, TreePayload} from "../sidebar/types"

// Connects to data-controller="sidebar-tree"
export default class extends Controller<HTMLElement> {
  static targets = ["data", "root", "itemTemplate"];
  static values = {
    spaceId: String,
    selectedId: String,
    selectedType: String,
    canUpdateSpace: Boolean,
  };

  declare dataTarget: HTMLScriptElement;
  declare rootTarget: HTMLElement;
  declare itemTemplateTarget: HTMLTemplateElement;
  declare spaceIdValue: string;
  declare selectedIdValue: string;
  declare selectedTypeValue: string;
  declare canUpdateSpaceValue: boolean;

  private payload!: TreePayload;
  private expanded!: Set<string>;
  private byId = new Map<string, TreeNode>();

  private handleReordered = (event: Event) => {
    const detail = (event as CustomEvent<{parentId?: string}>).detail;
    if (!detail?.parentId) return;

    // The client only holds the tree as it was at page load; a successful drag-and-drop just
    // changed the source of truth on the server. Persist the destination as expanded and reload
    // the sidebar frame so fresh JSON arrives and the tree re-renders from it (this also
    // restores drop-to-expand-a-collapsed-node, since that node will render expanded).
    this.expanded.add(detail.parentId);
    saveExpanded(this.spaceIdValue, this.expanded);
    this.reloadFrame();
  };

  // content_title_sync_controller patches the rendered <span> when a document is renamed, but the
  // JSON this controller renders from is frozen at frame load, so the very next render would put
  // the stale title back. Update the in-memory node too and re-render from it.
  private handleTitleUpdated = (event: Event) => {
    const {id, title, icon} =
      (event as CustomEvent<{id: string; title: string; icon?: ObjectIcon | null}>).detail ?? {};
    if (!id) return;

    // The same event is fired for tables, which are not part of this tree.
    const node = this.byId.get(id);
    if (!node) return;

    node.title = title;
    node.icon = icon ?? null;
    this.render();
  };

  connect() {
    this.payload = JSON.parse(this.dataTarget.textContent || "{}") as TreePayload;
    this.payload.nodes ||= [];
    this.index(this.payload.nodes);
    this.expanded = loadExpanded(this.spaceIdValue);
    this.expandAncestorsOfSelected();
    this.render();
    this.scrollSelectedIntoView();
    this.element.addEventListener("draggable:reordered", this.handleReordered);
    window.addEventListener("content-title-updated", this.handleTitleUpdated);
  }

  disconnect() {
    this.element.removeEventListener("draggable:reordered", this.handleReordered);
    window.removeEventListener("content-title-updated", this.handleTitleUpdated);
  }

  // Only the hierarchy tab's own frame, not the whole sidebar: reloading "space_sidebar" would
  // rebuild the tab shell and throw away which tab the user has open.
  private reloadFrame() {
    const frame = document.getElementById("hierarchy_sidebar_tab") as (HTMLElement & {reload?: () => void}) | null;
    frame?.reload?.();
  }

  toggle(event: Event) {
    const trigger = event.currentTarget as HTMLElement;
    const id = trigger.dataset.nodeId;
    if (!id) return;

    const node = this.byId.get(id);
    if (!node || (node.children ?? []).length === 0) return;

    if (this.expanded.has(id)) {
      this.expanded.delete(id);
    } else {
      this.expanded.add(id);
    }
    saveExpanded(this.spaceIdValue, this.expanded);
    this.render();
  }

  private index(nodes: TreeNode[], parentId: string | null = null) {
    for (const node of nodes) {
      this.byId.set(node.id, node);
      this.parentOf.set(node.id, parentId);
      this.index(node.children ?? [], node.id);
    }
  }

  private parentOf = new Map<string, string | null>();

  private expandAncestorsOfSelected() {
    if (this.selectedTypeValue !== "Document" || !this.selectedIdValue) return;
    let parent = this.parentOf.get(this.selectedIdValue) ?? null;
    while (parent) {
      this.expanded.add(parent);
      parent = this.parentOf.get(parent) ?? null;
    }
  }

  private get renderContext(): RenderContext {
    return {
      spaceId: this.spaceIdValue,
      canUpdateSpace: this.canUpdateSpaceValue,
      selectedId: this.currentSelectedId(),
    };
  }

  // The Stimulus value is only accurate as of the page load that rendered this frame. The
  // content frame navigates via Turbo's "advance" action (a real URL change without a full page
  // load), so once the user clicks through to another document the URL — not the stale value —
  // is the source of truth for which row should be highlighted on the next re-render.
  private currentSelectedId(): string | null {
    const match = window.location.pathname.match(/^\/d\/([^/]+)/);
    if (match) return match[1];
    return this.selectedIdValue || null;
  }

  // The root list is created fresh on every render, exactly like the nested lists, so that
  // Stimulus disconnects the old `draggable` instance and connects a new one. html5sortable only
  // stamps draggable="true"/role="option" on the children present when it initialises, so a
  // persistent list in ERB (which Stimulus never re-connects) left root-level items undraggable
  // after the first expand or collapse.
  private render() {
    const list = document.createElement("ul");
    list.className = "section-content-list";
    list.dataset.controller = "draggable";
    list.dataset.spaceId = this.spaceIdValue;

    this.renderInto(list, this.payload.nodes, 0);
    this.rootTarget.replaceChildren(list);
    this.updateEmptyState();
    this.applyArchivedVisibility();
  }

  // The server-rendered toggle sets the "ikigai_userPreferences_showArchived" cookie and the
  // "visibility" controller on the sidebar wrapper reacts to its change event for elements
  // already in the DOM. But every expand/collapse re-renders the tree from scratch, so freshly
  // created archived nodes need to pick up the current toggle state themselves.
  private get showArchived(): boolean {
    return document.cookie.split("; ").some(c => c === "ikigai_userPreferences_showArchived=true");
  }

  private applyArchivedVisibility() {
    this.rootTarget.querySelectorAll<HTMLElement>('[data-visibility-target="hideable"]')
      .forEach(el => { el.hidden = !this.showArchived; });
  }

  private renderInto(container: HTMLElement, nodes: TreeNode[], level: number) {
    const ctx = this.renderContext;
    for (const node of nodes) {
      const li = renderTreeItem(this.itemTemplateTarget, node, ctx, level);
      this.applyTriggerState(li, node);
      container.appendChild(li);

      const children = node.children ?? [];
      if (children.length > 0 && this.expanded.has(node.id)) {
        const childContainer = li.querySelector<HTMLElement>('ul[data-sidebar-tree-children="true"]');
        if (childContainer) this.renderInto(childContainer, children, level + 1);
      }
    }
  }

  private applyTriggerState(li: HTMLElement, node: TreeNode) {
    const trigger = li.querySelector<HTMLElement>(".collapsible-trigger");
    if (!trigger) return;

    if ((node.children ?? []).length === 0) {
      trigger.classList.add("is-leaf");
    } else if (this.expanded.has(node.id)) {
      trigger.classList.add("is-expanded");
    } else {
      trigger.classList.add("is-collapsed");
    }
  }

  private updateEmptyState() {
    const empty = this.element.querySelector<HTMLElement>(".section-empty");
    if (empty) empty.classList.toggle("hidden", this.payload.nodes.length > 0);
  }

  private scrollSelectedIntoView() {
    if (!this.selectedIdValue) return;
    const selected = this.rootTarget.querySelector<HTMLElement>(
      `li[data-node-id="${CSS.escape(this.selectedIdValue)}"] .content-link-container.selected`
    );
    if (!selected) return;
    requestAnimationFrame(() => selected.scrollIntoView({behavior: "instant"}));
  }
}

import {Controller} from "@hotwired/stimulus"
import {loadExpanded, saveExpanded} from "../sidebar/expansion_store"
import {renderTreeItem} from "../sidebar/tree_item"
import {RenderContext, TreeNode, TreePayload} from "../sidebar/types"

// Connects to data-controller="sidebar-tree"
export default class extends Controller<HTMLElement> {
  static targets = ["data", "root"];
  static values = {
    spaceId: String,
    selectedId: String,
    selectedType: String,
    canUpdateSpace: Boolean,
  };

  declare dataTarget: HTMLScriptElement;
  declare rootTarget: HTMLElement;
  declare spaceIdValue: string;
  declare selectedIdValue: string;
  declare selectedTypeValue: string;
  declare canUpdateSpaceValue: boolean;

  private payload!: TreePayload;
  private expanded!: Set<string>;
  private byId = new Map<string, TreeNode>();

  connect() {
    this.payload = JSON.parse(this.dataTarget.textContent || "{}") as TreePayload;
    this.payload.nodes ||= [];
    this.index(this.payload.nodes);
    this.expanded = loadExpanded(this.spaceIdValue);
    this.expandAncestorsOfSelected();
    this.render();
    this.scrollSelectedIntoView();
  }

  toggle(event: Event) {
    const trigger = event.currentTarget as HTMLElement;
    const id = trigger.dataset.nodeId;
    if (!id) return;

    const node = this.byId.get(id);
    if (!node || node.children.length === 0) return;

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
      this.index(node.children, node.id);
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
      selectedId: this.selectedIdValue || null,
      csrfToken: document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
    };
  }

  private render() {
    this.rootTarget.replaceChildren();
    this.renderInto(this.rootTarget, this.payload.nodes, 0);
    this.updateEmptyState();
  }

  private renderInto(container: HTMLElement, nodes: TreeNode[], level: number) {
    const ctx = this.renderContext;
    for (const node of nodes) {
      const li = renderTreeItem(node, ctx, level);
      this.applyTriggerState(li, node);
      container.appendChild(li);

      if (node.children.length > 0 && this.expanded.has(node.id)) {
        const childContainer = li.querySelector<HTMLElement>('ul[data-sidebar-tree-children="true"]');
        if (childContainer) this.renderInto(childContainer, node.children, level + 1);
      }
    }
  }

  private applyTriggerState(li: HTMLElement, node: TreeNode) {
    const trigger = li.querySelector<HTMLElement>(".collapsible-trigger");
    if (!trigger) return;

    if (node.children.length === 0) {
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

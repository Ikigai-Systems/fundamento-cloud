import {Controller} from "@hotwired/stimulus";
import React from "react";
import {createRoot, Root} from "react-dom/client";
import TableOfContentsPanel from "../components/TableOfContentsPanel";

export default class extends Controller {
  static targets = ["reactRoot"];
  static values = {content: Array};

  declare reactRootTarget: HTMLElement;
  declare contentValue: unknown[];

  private root: Root | undefined;
  private pendingBlocks: unknown[] | undefined;

  connect() {
    this.root = createRoot(this.reactRootTarget);
    this.renderComponent(this.pendingBlocks ?? this.contentValue ?? []);
    this.pendingBlocks = undefined;
  }

  disconnect() {
    this.root?.unmount();
    this.root = undefined;
  }

  receiveBlocks(blocks: unknown[]) {
    if (this.root) {
      this.renderComponent(blocks);
    } else {
      this.pendingBlocks = blocks;
    }
  }

  private renderComponent(blocks: unknown[]) {
    this.root?.render(<TableOfContentsPanel content={blocks} />);
  }
}

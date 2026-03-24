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

  connect() {
    this.root = createRoot(this.reactRootTarget);
    this.renderComponent(this.contentValue || []);
  }

  disconnect() {
    this.root?.unmount();
    this.root = undefined;
  }

  receiveBlocks(blocks: unknown[]) {
    this.renderComponent(blocks);
  }

  private renderComponent(blocks: unknown[]) {
    this.root?.render(<TableOfContentsPanel content={blocks} />);
  }
}

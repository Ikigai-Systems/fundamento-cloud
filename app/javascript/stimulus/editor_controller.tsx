import {Controller} from "@hotwired/stimulus";
import React from "react";
import {createRoot, Root} from "react-dom/client";
import {QueryClientProvider} from "@tanstack/react-query";
import {BlockNoteEditor} from "@blocknote/core";
import Editor from "../components/editor/Editor";
import CurrentSpaceContext from "../contextes/CurrentSpaceContext";
import queryClient from "../contextes/ReactQueryClient";
import {FeaturesContext} from "../contextes/FeaturesContext";
import type {Document, Space, User} from "../types";
import type schema from "../components/editor/schema";

export interface EditorConsumerController {
  receiveBlocks(blocks: unknown[]): void;
}

export default class extends Controller {
  static outlets = ["table-of-contents"];
  static targets = ["editorRoot"];
  static values = {
    document: Object,
    space: Object,
    currentUser: Object,
    databaseId: String,
    features: Array,
  };

  declare editorRootTarget: HTMLElement;
  declare tableOfContentsOutlets: EditorConsumerController[];
  declare hasTableOfContentsOutlet: boolean;
  declare documentValue: Document;
  declare spaceValue: Space;
  declare currentUserValue: User;
  declare databaseIdValue: string;
  declare featuresValue: string[];

  private root: Root | undefined;
  private editorInstance: BlockNoteEditor<typeof schema> | undefined;

  connect() {
    this.root = createRoot(this.editorRootTarget);
    this.renderComponent();
  }

  disconnect() {
    this.root?.unmount();
    this.root = undefined;
    this.editorInstance = undefined;
  }

  saveVersion(event: Event) {
    const form = (event.currentTarget as HTMLElement).closest("form");
    if (!form) return;
    const input = form.elements.namedItem("content_blocks") as HTMLInputElement | null;
    if (!input) return;
    input.value = JSON.stringify(this.editorInstance?.document);
  }

  tableOfContentsOutletConnected(outlet: EditorConsumerController) {
    if (this.editorInstance) {
      outlet.receiveBlocks(this.editorInstance.document);
    }
  }

  private onEditorReady(editor: BlockNoteEditor<typeof schema>) {
    this.editorInstance = editor;
    if (this.hasTableOfContentsOutlet) {
      this.tableOfContentsOutlets.forEach((o) => o.receiveBlocks(editor.document));
    }
  }

  private onConnectionChange(isStale: boolean) {
    this.dispatch("connection-changed", {
      detail: {stale: isStale},
      bubbles: true,
    });
  }

  private onDocumentChange(blocks: unknown[]) {
    if (this.hasTableOfContentsOutlet) {
      this.tableOfContentsOutlets.forEach((o) => o.receiveBlocks(blocks));
    }
  }

  private renderComponent() {
    this.root?.render(
      <FeaturesContext.Provider value={this.featuresValue || []}>
        <QueryClientProvider client={queryClient}>
          <CurrentSpaceContext.Provider value={{space: this.spaceValue}}>
            <Editor
              currentUser={this.currentUserValue}
              document={this.documentValue}
              databaseId={this.databaseIdValue}
              onEditorReady={(e) => this.onEditorReady(e)}
              onConnectionChange={(s) => this.onConnectionChange(s)}
              onDocumentChange={(b) => this.onDocumentChange(b)}
            />
          </CurrentSpaceContext.Provider>
        </QueryClientProvider>
      </FeaturesContext.Provider>
    );
  }
}

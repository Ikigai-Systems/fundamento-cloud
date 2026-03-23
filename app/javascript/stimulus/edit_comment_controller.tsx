import {Controller} from "@hotwired/stimulus"
import React from "react"
import ReactDOM, {Root} from "react-dom/client"
import EditCommentPanel from "../components/EditCommentPanel"
import {Document, Space, Table} from "../types"

export default class extends Controller {
  static values = {
    comment: Object,
    object: Object,
    space: Object,
    objectGid: String,
  }

  static targets = ["commentEditorRoot", "reactions"]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BlockNote document content, see CommentEditor.tsx
  declare commentValue: {id: number; content: any}
  declare objectValue: Document | Table
  declare spaceValue: Space
  declare objectGidValue: string
  declare commentEditorRootTarget: HTMLElement
  declare reactionsTarget: HTMLElement

  private root: Root | undefined
  private editing = false

  connect() {
    this.root = ReactDOM.createRoot(this.commentEditorRootTarget)
    this.renderEditor()
  }

  startEdit() {
    this.editing = true
    this.reactionsTarget.style.display = "none"
    this.renderEditor()
  }

  private stopEdit() {
    this.editing = false
    this.reactionsTarget.style.display = ""
    this.renderEditor()
  }

  private renderEditor() {
    this.root?.render(
      <EditCommentPanel
        object={this.objectValue}
        space={this.spaceValue}
        comment={this.commentValue}
        objectGid={this.objectGidValue}
        editing={this.editing}
        onSaved={() => this.stopEdit()}
        onCancelled={() => this.stopEdit()}
      />
    )
  }

  disconnect() {
    this.root?.unmount()
    this.root = undefined
  }
}

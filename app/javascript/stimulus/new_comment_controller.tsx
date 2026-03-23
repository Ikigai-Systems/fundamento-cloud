import {Controller} from "@hotwired/stimulus"
import React from "react"
import ReactDOM, {Root} from "react-dom/client"
import {QueryClientProvider} from "@tanstack/react-query"
import {Document, Space, Table} from "../types"
import CommentEditor from "../components/editor/CommentEditor"
import CurrentSpaceContext from "../contextes/CurrentSpaceContext"
import queryClient from "../contextes/ReactQueryClient"

export default class extends Controller {
  static values = {
    object: Object,
    space: Object,
  }

  static targets = ["commentEditorRoot", "contentField"]

  declare objectValue: Document | Table
  declare spaceValue: Space
  declare commentEditorRootTarget: HTMLElement
  declare contentFieldTarget: HTMLInputElement

  private root: Root | undefined

  connect() {
    this.root = ReactDOM.createRoot(this.commentEditorRootTarget)
    this.root.render(
      <QueryClientProvider client={queryClient}>
        <CurrentSpaceContext.Provider value={{space: this.spaceValue}}>
          <CommentEditor
            objectId={this.objectValue.id}
            onContentChange={(content) => {
              this.contentFieldTarget.value = JSON.stringify(content)
            }}
          />
        </CurrentSpaceContext.Provider>
      </QueryClientProvider>
    )
  }

  disconnect() {
    this.root?.unmount()
    this.root = undefined
  }
}

---
globs: ["app/javascript/stimulus/**/*.ts", "app/javascript/stimulus/**/*.tsx", "app/javascript/components/**/*.tsx", "app/views/**/*.html.erb", "app/components/**/*.html.erb"]
---

# Stimulus + React Bridge Pattern

When a feature needs both Rails/Turbo (ERB, forms, Turbo frames) and React (rich editors, complex UI), consider using a Stimulus controller as the bridge.

## Core pattern: Stimulus owns the state, React reflects it

The Stimulus controller owns mutable state as a plain private property. React is stateless with respect to that state — it receives it as props and calls callbacks to signal changes back.

```ts
// controller owns state
private editing = false

startEdit() {
  this.editing = true
  this.renderComponent()   // re-render React with new props
}

private renderComponent() {
  this.root?.render(
    <MyComponent
      editing={this.editing}
      onDone={() => this.stopEdit()}  // React signals back via callback
    />
  )
}
```

Calling `this.root.render()` multiple times is safe — React diffs and patches only what changed. No unmount/remount occurs as long as the root element type stays the same.

## Hiding non-React DOM elements when React is in an active state

Use `element.style.display = "none"` / `""` rather than the `hidden` attribute. Elements with Tailwind utility classes (e.g. `flex`) have those classes applied after the `[hidden]` preflight rule in the CSS cascade, so `display: flex` wins over `display: none` from the `hidden` attribute. Inline styles have higher specificity and always win.

```ts
this.reactionsTarget.style.display = "none"   // hide
this.reactionsTarget.style.display = ""        // restore
```

## Naming conventions

- Controller file: `<feature>_controller.tsx` (`.tsx` for JSX in the controller)
- Target for React mount point: `commentEditorRoot`, `editorRoot` — name it after what mounts there, not generic `reactRoot`
- Register as kebab-case: `edit-comment`, `new-comment`

## Providers

If the React component needs `QueryClientProvider` / context providers, wrap them in the controller's `renderComponent()`. Don't rely on a parent component to provide them.

# Server-Side React Rendering Setup

This document explains how React components are used in the BlockNote converter for server-side rendering.

## Overview

The BlockNote converter uses React components for custom block specs (`AdvancedTable`, `ChartBlock`) and inline content specs (`FormulaInlineContent`). These React components are rendered server-side in Node.js using a DOM implementation.

## Key Components

### 1. Schema Definition (`src/strippedSchema.tsx`)

Uses React-based block specs:
```tsx
import {createReactBlockSpec, createReactInlineContentSpec} from "@blocknote/react";

const AdvancedTable = createReactBlockSpec(
  { /* config */ },
  {
    render: () => {
      return <p>Table</p>;
    },
  }
);
```

### 2. DOM Setup (`src/setupDOM.ts`)

Initializes a virtual DOM environment using happy-dom:
- Provides `window`, `document`, `navigator` globals
- Mocks `requestIdleCallback` and `cancelIdleCallback` for React
- Called once at module initialization

### 3. Build Configuration

The esbuild configuration in `package.json`:
```json
{
  "scripts": {
    "build": "... --external:jsdom --external:happy-dom --loader:.tsx=tsx --jsx=automatic ..."
  }
}
```

Key flags:
- `--loader:.tsx=tsx`: Process TypeScript JSX files
- `--jsx=automatic`: Use React's automatic JSX runtime
- `--external:jsdom --external:happy-dom`: Don't bundle DOM libraries (use installed packages)

## Dependencies

Required packages:
- `@blocknote/server-util`: Provides ServerBlockNoteEditor for server-side processing
- `@blocknote/react`: Provides createReactBlockSpec and createReactInlineContentSpec
- `react` & `react-dom`: React runtime (installed as transitive dependencies)
- `happy-dom`: Lightweight DOM implementation for Node.js

## How It Works

1. **Initialization**: When the module loads, `setupDOM()` creates a virtual DOM environment
2. **Schema Creation**: React components are defined using `createReactBlockSpec`
3. **Editor Creation**: `ServerBlockNoteEditor.create()` uses the custom schema
4. **Rendering**: When converting blocks, React components are server-rendered to HTML/Markdown
5. **Output**: The rendered content is returned without browser dependencies

## Benefits

- **Code Reuse**: Same React components can be used client-side and server-side
- **Type Safety**: Full TypeScript support with JSX
- **Consistency**: Server-rendered output matches client-side rendering
- **Maintainability**: Single source of truth for block rendering logic

## Alternative Approach

If you don't need React, you can use vanilla JS:
```typescript
import {createBlockSpec} from "@blocknote/core";

const AdvancedTable = createBlockSpec(
  { /* config */ },
  {
    render: () => {
      const p = document.createElement("p");
      p.textContent = "Table";
      return { dom: p };
    },
  }
);
```

This avoids the DOM setup overhead but requires different code for client/server.
